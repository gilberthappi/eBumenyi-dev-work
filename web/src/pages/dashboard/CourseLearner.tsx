import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  PlayCircle,
  FileText,
  ImageIcon,
  Loader2,
  Menu,
  X,
  ClipboardList,
  GraduationCap,
  BookOpen,
  Trophy,
  Layers,
  Lock,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import TopBar from "@/components/navigation/TopBar";
import { getCourseSectionsWithChapters, getChapterSlides, getChapterMidTestId } from "@/services/course.service";
import { getCourseFinalTestIds } from "@/services/finaltest.service";
import { markSlideComplete, getCourseProgress, getStudentStatistics } from "@/services/progress.service";
import { ISection, IChapter, ISlide, ICourseIntro } from "@/types";
import { getBackendURL } from "@/config/api.config";

const VIDEO_EXTS = new Set(["mp4", "webm", "avi", "mov", "mkv", "flv", "wmv", "m4v", "3gp"]);

const resolveMediaUrl = (url: string): string =>
  url.startsWith("http") ? url : `${getBackendURL()}${url}`;

function detectFileType(url: string): "video" | "pdf" | "image" {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (VIDEO_EXTS.has(ext)) return "video";
  if (ext === "pdf") return "pdf";
  return "image";
}

const SlideViewer: React.FC<{ slide: ISlide }> = ({ slide }) => {
  const kind = slide.file ? detectFileType(slide.file) : null;

  if (kind === "pdf") {
    return (
      <div className="flex flex-col" style={{ height: "calc(100vh - 100px)" }}>
        <iframe
          key={slide.id}
          src={slide.file}
          title="Slide PDF"
          className="flex-1 w-full border-0 min-h-0"
        />
      </div>
    );
  }

  return (
    <div className="px-6 py-5 space-y-5">
      {slide.file ? (
        <>
          {kind === "video" && (
            <div className="relative w-full rounded-2xl overflow-hidden bg-black shadow-sm" style={{ paddingBottom: "56.25%" }}>
              <video
                key={slide.id}
                src={resolveMediaUrl(slide.file)}
                controls
                className="absolute inset-0 w-full h-full outline-none"
              />
            </div>
          )}
          {kind === "image" && (
            <div className="rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex justify-center shadow-sm">
              <img
                key={slide.id}
                src={slide.file}
                alt={slide.note || "Slide"}
                className="max-w-full object-contain"
                style={{ maxHeight: "70vh" }}
              />
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center" style={{ minHeight: 200 }}>
          <FileText size={48} className="text-gray-200" />
        </div>
      )}

      {(slide.note || slide.description) && (
        <div className="space-y-2 pb-4">
          {slide.note && (
            <h2 className="text-xl font-semibold text-gray-900">{slide.note}</h2>
          )}
          {slide.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{slide.description}</p>
          )}
        </div>
      )}
    </div>
  );
};

const SlideIcon: React.FC<{ url?: string; size?: number }> = ({ url, size = 14 }) => {
  if (!url) return <Circle size={size} className="text-gray-300" />;
  const kind = detectFileType(url);
  if (kind === "video") return <PlayCircle size={size} className="text-[#3363AD]" />;
  if (kind === "pdf") return <FileText size={size} className="text-orange-500" />;
  return <ImageIcon size={size} className="text-green-500" />;
};

const CourseLearner: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [courseTitle, setCourseTitle] = useState("");
  const [courseIntro, setCourseIntro] = useState<ICourseIntro | null>(null);
  const [sections, setSections] = useState<ISection[]>([]);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [courseError, setCourseError] = useState<string | null>(null);

  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] = useState<IChapter | null>(null);
  const [slides, setSlides] = useState<ISlide[]>([]);
  const [isLoadingSlides, setIsLoadingSlides] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [completedSlideIds, setCompletedSlideIds] = useState<Set<string>>(new Set());
  const [completedChapterIds, setCompletedChapterIds] = useState<Set<string>>(new Set());
  const [serverCompletedChapterIds, setServerCompletedChapterIds] = useState<Set<string>>(new Set());
  const [chapterMidTestId, setChapterMidTestId] = useState<string | null>(null);
  const [finalTestId, setFinalTestId] = useState<string | null>(null);
  const [finalExamId, setFinalExamId] = useState<string | null>(null);
  const [isCourseComplete, setIsCourseComplete] = useState(false);
  const [finalTestPassed, setFinalTestPassed] = useState(false);
  const [finalExamPassed, setFinalExamPassed] = useState(false);
  const [preTestAttempted, setPreTestAttempted] = useState(false);
  const [preTestExists, setPreTestExists] = useState(true);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [sidebarChapterId, setSidebarChapterId] = useState<string | null>(null);
  const markingRef = useRef(false);

  const loadChapter = useCallback(async (chapter: IChapter, initialSlideId?: string, resumeCompletedIds?: Set<string>, initialSlideIndex?: number) => {
    setActiveChapter(chapter);
    setSidebarChapterId(chapter.id);
    setSlideIndex(0);
    setSlides([]);
    setChapterMidTestId(null);
    setIsLoadingSlides(true);
    try {
      const [slidesRes, midTestId] = await Promise.all([
        getChapterSlides(chapter.id),
        getChapterMidTestId(chapter.id),
      ]);
      const data = slidesRes.data as unknown as { slides?: ISlide[] };
      const loadedSlides = (data?.slides ?? []).sort((a, b) => a.slideNumber - b.slideNumber);
      setSlides(loadedSlides);
      setChapterMidTestId(midTestId);
      if (resumeCompletedIds) {
        const firstUncompleted = loadedSlides.findIndex((s) => !resumeCompletedIds.has(s.id));
        if (firstUncompleted > 0) setSlideIndex(firstUncompleted);
      } else if (initialSlideId) {
        const idx = loadedSlides.findIndex((s) => s.id === initialSlideId);
        if (idx > 0) setSlideIndex(idx);
      } else if (initialSlideIndex != null) {
        // -1 means last slide; otherwise clamp to valid range
        const target = initialSlideIndex === -1
          ? loadedSlides.length - 1
          : Math.min(initialSlideIndex, loadedSlides.length - 1);
        if (target > 0) setSlideIndex(target);
      }
    } catch {
      setSlides([]);
    } finally {
      setIsLoadingSlides(false);
    }
    setOutlineOpen(false);
  }, []);

  useEffect(() => {
    if (!courseId) return;
    setIsLoadingCourse(true);
    setCourseError(null);
    const state = location.state as { completedChapterId?: string; revisit?: boolean; afterSlide?: number; passedFinalTest?: boolean; passedFinalExam?: boolean; preTestCompleted?: boolean } | null;
    const completedChapterId = state?.completedChapterId ?? null;
    const revisit = state?.revisit ?? false;
    const afterSlide = state?.afterSlide ?? null;
    const passedFinalTestFromState = state?.passedFinalTest ?? false;
    const passedFinalExamFromState = state?.passedFinalExam ?? false;
    const preTestCompleted = state?.preTestCompleted ?? false;
    getCourseSectionsWithChapters(courseId)
      .then(async (res) => {
        const data = res.data as unknown as { title?: string; sections?: ISection[]; intro?: ICourseIntro };
        setCourseTitle(data?.title ?? "Course");
        setCourseIntro(data?.intro ?? null);
        const secs: ISection[] = data?.sections ?? [];
        setSections(secs);
        if (secs.length === 0) return;
        try {
          const [stats, progress, finalIds] = await Promise.all([
            getStudentStatistics(),
            getCourseProgress(courseId),
            getCourseFinalTestIds(courseId).catch(() => ({ finalTestId: null as string | null, finalExamId: null as string | null })),
          ]);
          const ftId = finalIds.finalTestId;
          const feId = finalIds.finalExamId;
          setFinalTestId(ftId);
          setFinalExamId(feId);
          let mergedDone = new Set<string>();
          let preTestGatePassed = false;
          if (progress) {
            setCompletedSlideIds(new Set(progress.completedSlideIds));
            const doneChapters = progress.chapterProgress
              .filter((cp) => cp.isCompleted)
              .map((cp) => cp.chapterId);
            mergedDone = new Set(doneChapters);
            if (completedChapterId) mergedDone.add(completedChapterId);
            setCompletedChapterIds(mergedDone);
            setServerCompletedChapterIds(mergedDone);
            setFinalTestPassed((progress.finalTestStatus?.passed ?? false) || passedFinalTestFromState);
            setFinalExamPassed((progress.finalExamStatus?.passed ?? false) || passedFinalExamFromState);
            const localPreTestKey = `pretest_attempted_${courseId}`;
            if (progress.preTestStatus !== null) {
              setPreTestExists(true);
              preTestGatePassed = progress.preTestStatus.attempted
                || localStorage.getItem(localPreTestKey) === "true";
            } else {
              setPreTestExists(false);
              preTestGatePassed = true;
            }
            if (preTestCompleted) {
              preTestGatePassed = true;
              localStorage.setItem(localPreTestKey, "true");
            }
            setPreTestAttempted(preTestGatePassed);
          }
          const courseStats = stats.courses.find((c) => c.courseId === courseId);
          setIsCourseComplete(courseStats?.isCompleted ?? false);

          // If returning from a mid-test
          if (completedChapterId) {
            // afterSlide === -2 is a sentinel meaning "mid-test was on the last slide,
            // no more slides in this chapter, advance to next chapter"
            const advanceToNext = !revisit || afterSlide === -2;
            if (!advanceToNext) {
              // Revisit: reload same chapter starting at the slide right after the mid-test
              for (const sec of secs) {
                const ch = sec.chapters?.find((c) => c.id === completedChapterId);
                if (ch) {
                  setOpenSectionId(sec.id);
                  const slideAfterMidTest = afterSlide != null && afterSlide >= 0
                    ? afterSlide
                    : (ch.activityAt != null ? ch.activityAt - 1 : 0);
                  loadChapter(ch, undefined, undefined, slideAfterMidTest);
                  return;
                }
              }
              setOpenSectionId(secs[0].id);
              return;
            }
            // First-time completion OR last-slide revisit — advance to the next chapter
            let found = false;
            for (const sec of secs) {
              for (const ch of (sec.chapters ?? [])) {
                if (found) {
                  setOpenSectionId(sec.id);
                  loadChapter(ch);
                  return;
                }
                if (ch.id === completedChapterId) found = true;
              }
            }
            // No next chapter — last chapter done, go to final test
            if (ftId) {
              navigate(`/learn/${courseId}/final-test/${ftId}`);
            } else {
              setOpenSectionId(secs[0].id);
            }
            return;
          }

          // If returning from pre-test submission, load chapter 1
          if (preTestCompleted) {
            const firstSec = secs[0];
            const firstChapter = firstSec?.chapters?.[0];
            if (firstChapter) {
              setOpenSectionId(firstSec.id);
              loadChapter(firstChapter);
              return;
            }
          }

          const loc = stats.lastViewedLocation;
          if (courseStats?.isCompleted) {
            setOpenSectionId(secs[0].id);
            return;
          }
          if (loc && loc.courseId === courseId) {
            const allChaps = secs.flatMap(s => s.chapters ?? []);
            for (const sec of secs) {
              const ch = sec.chapters?.find((c) => c.id === loc.chapterId);
              if (ch) {
                const chapIdx = allChaps.findIndex(c => c.id === ch.id);
                const chapAccessible = chapIdx === 0
                  ? preTestGatePassed
                  : mergedDone.has(allChaps[chapIdx - 1]?.id);
                if (chapAccessible) {
                  setOpenSectionId(sec.id);
                  const completed = new Set(progress?.completedSlideIds ?? []);
                  loadChapter(ch, undefined, completed);
                  return;
                }
                break; // chapter found but locked — fall through to overview
              }
            }
          }
        } catch { /* fall through to default */ }
        setOpenSectionId(secs[0].id);
      })
      .catch(() => setCourseError("Failed to load course. Please go back and try again."))
      .finally(() => setIsLoadingCourse(false));
  }, [courseId, loadChapter]);

  const markCurrentComplete = useCallback(async () => {
    const slide = slides[slideIndex];
    if (!slide || completedSlideIds.has(slide.id) || markingRef.current) return;
    markingRef.current = true;
    try {
      await markSlideComplete(slide.id);
      setCompletedSlideIds((prev) => {
        const next = new Set(prev).add(slide.id);
        const allDone = slides.every((s) => next.has(s.id));
        if (allDone && activeChapter) {
          setCompletedChapterIds((prev2) => new Set(prev2).add(activeChapter.id));
        }
        return next;
      });
    } finally {
      markingRef.current = false;
    }
  }, [slides, slideIndex, completedSlideIds, activeChapter]);

  const goToSlide = (index: number) => {
    markCurrentComplete();
    setSlideIndex(index);
  };

  const handlePrev = () => {
    if (slideIndex > 0) goToSlide(slideIndex - 1);
  };

  const handleNext = async () => {
    await markCurrentComplete();
    if (slideIndex < slides.length - 1) setSlideIndex(slideIndex + 1);
  };

  const handleNextChapter = async () => {
    await markCurrentComplete();
    let found = false;
    for (const sec of sections) {
      for (const ch of (sec.chapters ?? [])) {
        if (found) { setOpenSectionId(sec.id); loadChapter(ch); return; }
        if (ch.id === activeChapter?.id) found = true;
      }
    }
    if (finalTestId) {
      navigate(`/learn/${courseId}/final-test/${finalTestId}`);
    } else {
      setActiveChapter(null);
    }
  };

  const isChapterDone = (chapter: IChapter) => completedChapterIds.has(chapter.id);

  const allChaptersInOrder = sections.flatMap(sec => sec.chapters ?? []);
  const isChapterAccessible = (chapter: IChapter): boolean => {
    const idx = allChaptersInOrder.findIndex(ch => ch.id === chapter.id);
    if (idx === 0) return preTestAttempted;
    return completedChapterIds.has(allChaptersInOrder[idx - 1].id);
  };

  const currentSlide = slides[slideIndex] ?? null;
  const totalSlides = slides.length;
  const completedInChapter = slides.filter((s) => completedSlideIds.has(s.id)).length;
  const chapterProgress = totalSlides > 0 ? Math.round((completedInChapter / totalSlides) * 100) : 0;
  // 0-indexed slide index after which the mid test should fire (activityAt is 1-indexed combined position)
  const midTestSlideIdx = chapterMidTestId && activeChapter?.activityAt != null
    ? activeChapter.activityAt - 2   // slide just before mid-test slot
    : totalSlides - 1;               // default: after last slide

  if (isLoadingCourse) {
    return (
      <div className="flex items-center justify-center flex-1 bg-white">
        <Loader2 size={28} className="animate-spin text-[#3363AD]" />
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="flex flex-col items-center gap-3 flex-1 justify-center text-sm text-red-500 p-8">
        <p>{courseError}</p>
        <Button size="sm" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={`
          ${outlineOpen ? "flex" : "hidden"} md:flex
          flex-col w-full md:w-72 flex-shrink-0
          border-r border-gray-100 bg-gray-50
          absolute md:relative inset-0 z-20 md:z-auto
          overflow-hidden
        `}
      >
          {/* ── Brand header ──────────────────────────────────────── */}
          <div className="flex-shrink-0 px-4 py-4 bg-gradient-to-r from-primary to-primary/90 flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white border-2 border-white/30 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                <img src="/chw.png" alt="eBumenyi" className="w-6 h-6 object-contain" />
              </div>
              <span className="text-white font-semibold text-sm">eBumenyi</span>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-1">
            {/* Course content */}
            <div className="px-3 pt-2">
              <p className="px-1 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Course Content
              </p>
              {/* Course Overview & Pre-Test as first items */}
              <div className="space-y-0.5 mb-1">
                <button
                  onClick={() => { setActiveChapter(null); setSlides([]); setOutlineOpen(false); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left font-medium ${
                    !activeChapter
                      ? "bg-[#3363AD]/10 text-[#3363AD]"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {activeChapter !== null && preTestAttempted
                    ? <CheckCircle2 size={13} className="flex-shrink-0 text-green-500" />
                    : <BookOpen size={13} className="flex-shrink-0" />
                  }
                  Course Overview
                  {!activeChapter && <ChevronRight size={11} className="ml-auto flex-shrink-0 text-[#3363AD]" />}
                  {activeChapter !== null && preTestAttempted && (
                    <span className="ml-auto text-[10px] text-green-600">Done</span>
                  )}
                </button>
                {preTestExists && (
                  <button
                    onClick={() => { navigate(`/learn/${courseId}/pre-test`); setOutlineOpen(false); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left font-medium ${
                      preTestAttempted ? "text-green-700 hover:bg-green-50" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {preTestAttempted
                      ? <CheckCircle2 size={13} className="flex-shrink-0 text-green-500" />
                      : <ClipboardList size={13} className="flex-shrink-0" />
                    }
                    Pre-Test
                    {preTestAttempted && <span className="ml-auto text-[10px] text-green-600">Done</span>}
                  </button>
                )}
              </div>
              {sections.map((section) => {
                const firstChapter = section.chapters?.[0];
                const sectionLocked = firstChapter ? !isChapterAccessible(firstChapter) : true;
                const sectionChapters = section.chapters ?? [];
                const sectionDone = !sectionLocked && sectionChapters.length > 0 &&
                  sectionChapters.every(ch => completedChapterIds.has(ch.id));
                return (
                <div key={section.id} className="mb-1">
                  <button
                    className={`w-full flex items-center justify-between px-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
                      sectionLocked
                        ? "text-gray-400 cursor-not-allowed"
                        : sectionDone
                        ? "text-green-700 hover:bg-green-50"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      if (!sectionLocked) setOpenSectionId((prev) => (prev === section.id ? null : section.id));
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {sectionLocked
                        ? <Lock size={12} className="flex-shrink-0 text-gray-300" />
                        : sectionDone
                        ? <CheckCircle2 size={12} className="flex-shrink-0 text-green-500" />
                        : <Layers size={12} className="flex-shrink-0 text-gray-400" />
                      }
                      <span className="text-left line-clamp-1">{section.title}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                      {sectionDone && (
                        <span className="text-[10px] text-green-600">Done</span>
                      )}
                      {!sectionLocked && (
                        <ChevronDown
                          size={12}
                          className={`transition-transform ${openSectionId === section.id ? "rotate-180" : ""}`}
                        />
                      )}
                    </div>
                  </button>

                  {openSectionId === section.id && (
                    <div className="ml-1 mt-0.5 space-y-0.5">
                      {(section.chapters ?? []).map((chapter) => {
                        const isActiveChapter = activeChapter?.id === chapter.id;
                        const chapterLocked = !isChapterAccessible(chapter);
                        return (
                          <div key={chapter.id}>
                            <button
                              onClick={() => {
                                if (chapterLocked) return;
                                if (isActiveChapter) {
                                  setSidebarChapterId((prev) => prev === chapter.id ? null : chapter.id);
                                } else {
                                  loadChapter(chapter);
                                }
                              }}
                              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left ${
                                chapterLocked
                                  ? "text-gray-400 cursor-not-allowed"
                                  : isActiveChapter
                                  ? "bg-[#3363AD]/10 text-[#3363AD]"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {chapterLocked ? (
                                <Lock size={13} className="flex-shrink-0 text-gray-300" />
                              ) : isChapterDone(chapter) ? (
                                <CheckCircle2 size={13} className="flex-shrink-0 text-green-500" />
                              ) : (
                                <Circle
                                  size={13}
                                  className={`flex-shrink-0 ${isActiveChapter ? "text-[#3363AD]" : "text-gray-300"}`}
                                />
                              )}
                              <span className="line-clamp-1 font-medium">{chapter.title}</span>
                              {!chapterLocked && isActiveChapter && (
                                sidebarChapterId === chapter.id
                                  ? <ChevronDown size={11} className="ml-auto flex-shrink-0 text-[#3363AD]" />
                                  : <ChevronRight size={11} className="ml-auto flex-shrink-0 text-[#3363AD]" />
                              )}
                            </button>

                            {/* Slides under active chapter */}
                            {isActiveChapter && sidebarChapterId === chapter.id && !isLoadingSlides && slides.length > 0 && (() => {
                              // activityAt is 1-indexed position of mid test in combined list
                              const midSlot = chapterMidTestId
                                ? (chapter.activityAt != null ? chapter.activityAt - 1 : slides.length)
                                : -1; // 0-indexed insertion slot; -1 = no mid test

                              const midTestBtn = (
                                <button
                                  onClick={() => {
                                    const isRevisit = serverCompletedChapterIds.has(chapter.id);
                                    // -2 signals "no slides remain after mid-test, advance to next chapter"
                                    const afterSlideParam = isRevisit && midSlot >= slides.length ? -2 : (midSlot > 0 ? midSlot : 0);
                                    navigate(
                                      `/learn/${courseId}/mid-test/${chapterMidTestId}?chapter=${encodeURIComponent(chapter.title)}&chapterId=${chapter.id}&revisit=${isRevisit}&afterSlide=${afterSlideParam}`
                                    );
                                  }}
                                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    serverCompletedChapterIds.has(chapter.id)
                                      ? "text-green-700 hover:bg-green-50"
                                      : "text-amber-700 hover:bg-amber-50"
                                  }`}
                                >
                                  {serverCompletedChapterIds.has(chapter.id)
                                    ? <CheckCircle2 size={12} className="flex-shrink-0 text-green-500" />
                                    : <ClipboardList size={12} className="flex-shrink-0" />
                                  }
                                  Mid Test
                                  {serverCompletedChapterIds.has(chapter.id) && (
                                    <span className="ml-auto text-[10px] text-green-600">Done</span>
                                  )}
                                </button>
                              );

                              const firstUncompletedIdx = slides.findIndex(s => !completedSlideIds.has(s.id));
                              const maxAccessibleIdx = firstUncompletedIdx === -1 ? slides.length - 1 : firstUncompletedIdx;

                              return (
                                <div className="ml-5 border-l-2 border-[#3363AD]/20 pl-2 mt-0.5 space-y-0.5 pb-1">
                                  {slides.map((slide, i) => {
                                    const slideAccessible = i <= maxAccessibleIdx || completedSlideIds.has(slide.id);
                                    return (
                                      <React.Fragment key={slide.id}>
                                        {i === midSlot && midTestBtn}
                                        <button
                                          onClick={() => { if (slideAccessible) goToSlide(i); }}
                                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors text-left ${
                                            i === slideIndex
                                              ? "bg-[#3363AD]/10 text-[#3363AD] font-medium"
                                              : completedSlideIds.has(slide.id)
                                              ? "text-green-600 hover:bg-green-50"
                                              : slideAccessible
                                              ? "text-gray-500 hover:bg-gray-100"
                                              : "text-gray-300 cursor-not-allowed"
                                          }`}
                                        >
                                          <SlideIcon url={slideAccessible ? slide.file : undefined} size={12} />
                                          <span className="line-clamp-1 flex-1">
                                            {slide.note || `Slide ${i + 1}`}
                                          </span>
                                          {completedSlideIds.has(slide.id) && i !== slideIndex && (
                                            <CheckCircle2 size={10} className="flex-shrink-0 text-green-500" />
                                          )}
                                          {!slideAccessible && (
                                            <Lock size={9} className="flex-shrink-0 text-gray-300" />
                                          )}
                                        </button>
                                      </React.Fragment>
                                    );
                                  })}
                                  {/* Mid test after all slides (when activityAt >= slides.length + 1 or unset) */}
                                  {midSlot >= slides.length && midTestBtn}
                                </div>
                              );
                            })()}

                            {isActiveChapter && sidebarChapterId === chapter.id && isLoadingSlides && (
                              <div className="ml-5 py-2 flex items-center gap-2 text-xs text-gray-400 pl-2">
                                <Loader2 size={11} className="animate-spin" />
                                Loading slides...
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
              })}
            </div>

            {/* Final assessments */}
            {(finalTestId || finalExamId) && (
              <div className="px-3 pt-2">
                <p className="px-1 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Final Assessments
                </p>
                <div className="space-y-0.5">
                  {finalTestId && (
                    <button
                      onClick={() => {
                        if (!isCourseComplete) return;
                        navigate(`/learn/${courseId}/final-test/${finalTestId}`);
                        setOutlineOpen(false);
                      }}
                      disabled={!isCourseComplete}
                      title={!isCourseComplete ? "Complete all lessons to unlock" : undefined}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left font-medium ${
                        finalTestPassed
                          ? "text-green-700 hover:bg-green-50"
                          : isCourseComplete
                          ? "text-gray-600 hover:bg-gray-100"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {finalTestPassed
                        ? <CheckCircle2 size={13} className="flex-shrink-0 text-green-500" />
                        : isCourseComplete
                        ? <Trophy size={13} className="flex-shrink-0" />
                        : <Lock size={13} className="flex-shrink-0" />
                      }
                      Final Test
                      {finalTestPassed && (
                        <span className="ml-auto text-[10px] text-green-600">Passed</span>
                      )}
                      {!isCourseComplete && (
                        <span className="ml-auto text-[10px]">Locked</span>
                      )}
                    </button>
                  )}
                  {finalExamId && (
                    <button
                      onClick={() => {
                        if (!isCourseComplete || !finalTestPassed) return;
                        navigate(`/learn/${courseId}/final-exam/${finalExamId}`);
                        setOutlineOpen(false);
                      }}
                      disabled={!isCourseComplete || !finalTestPassed}
                      title={
                        !isCourseComplete
                          ? "Complete all lessons to unlock"
                          : !finalTestPassed
                          ? "Pass the Final Test to unlock"
                          : undefined
                      }
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left font-medium ${
                        finalExamPassed
                          ? "text-purple-700 hover:bg-purple-50"
                          : isCourseComplete && finalTestPassed
                          ? "text-gray-600 hover:bg-gray-100"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {finalExamPassed
                        ? <CheckCircle2 size={13} className="flex-shrink-0 text-purple-500" />
                        : isCourseComplete && finalTestPassed
                        ? <GraduationCap size={13} className="flex-shrink-0" />
                        : <Lock size={13} className="flex-shrink-0" />
                      }
                      Final Exam
                      {finalExamPassed && (
                        <span className="ml-auto text-[10px] text-purple-600">Passed</span>
                      )}
                      {(!isCourseComplete || !finalTestPassed) && (
                        <span className="ml-auto text-[10px]">Locked</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
      </aside>

      {/* ── Right column ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* <TopBar onMenuClick={() => setOutlineOpen((o) => !o)} /> */}

        {/* Course context strip */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 h-10 border-b border-gray-100 bg-gray-50/70">
          <button
            onClick={() => navigate("/my-learning")}
            className="p-1 rounded text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0"
            title="Back to My Learning"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-700 truncate">{courseTitle}</span>
            {activeChapter && (
              <>
                <ChevronRight size={10} className="text-gray-300 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700 truncate">{activeChapter.title}</span>
              </>
            )}
          </div>
          {totalSlides > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-2.5 py-0.5 flex-shrink-0">
              <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#3363AD] rounded-full transition-all" style={{ width: `${chapterProgress}%` }} />
              </div>
              <span className="text-[10px] font-medium text-gray-500">{chapterProgress}%</span>
            </div>
          )}
          <button
            className="md:hidden p-1 rounded text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0"
            onClick={() => setOutlineOpen((o) => !o)}
          >
            {outlineOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {!activeChapter ? (
            <div className="flex-1 overflow-y-auto">
              {courseIntro?.bannerImage && (
                <div className="w-full overflow-hidden bg-gray-100" style={{ maxHeight: 260 }}>
                  <img
                    src={courseIntro.bannerImage}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ maxHeight: 260 }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
              <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {courseIntro?.title ?? courseTitle}
                  </h2>
                  {courseIntro?.summary && (
                    <p className="text-sm text-gray-600 leading-relaxed">{courseIntro.summary}</p>
                  )}
                </div>
                <Button
                  onClick={() => {
                    if (!preTestAttempted) {
                      navigate(`/learn/${courseId}/pre-test`);
                      return;
                    }
                    const firstSec = sections[0];
                    const firstChapter = firstSec?.chapters?.[0];
                    if (firstChapter) { setOpenSectionId(firstSec.id); loadChapter(firstChapter); }
                  }}
                  className="flex items-center gap-2"
                >
                  {preTestAttempted ? <PlayCircle size={16} /> : <ClipboardList size={16} />}
                  {preTestAttempted ? "Start Learning" : "Take Pre-Test"}
                </Button>
              </div>
            </div>
          ) : isLoadingSlides ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-[#3363AD]" />
            </div>
          ) : slides.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
              No content available for this chapter.
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Slide viewer — scrollable */}
              <div className="flex-1 overflow-y-auto">
                {currentSlide && <SlideViewer slide={currentSlide} />}
              </div>

              {/* Navigation bar */}
              <div className="flex-shrink-0 border-t border-gray-100 bg-white px-6 py-3 flex items-center justify-between gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={slideIndex === 0}
                  className="flex items-center gap-1.5 min-w-[90px]"
                >
                  <ArrowLeft size={14} />
                  Previous
                </Button>

                <span className="text-sm text-gray-400">{slideIndex + 1} of {totalSlides}</span>

                {slideIndex === midTestSlideIdx && chapterMidTestId ? (
                  <Button
                    size="sm"
                    onClick={async () => {
                      await markCurrentComplete();
                      const isRevisit = serverCompletedChapterIds.has(activeChapter?.id ?? "");
                      // -2 signals "no slides remain after mid-test, advance to next chapter"
                      const afterSlideParam = isRevisit && slideIndex === totalSlides - 1 ? -2 : slideIndex + 1;
                      navigate(
                        `/learn/${courseId}/mid-test/${chapterMidTestId}?chapter=${encodeURIComponent(activeChapter?.title ?? "")}&chapterId=${activeChapter?.id ?? ""}&revisit=${isRevisit}&afterSlide=${afterSlideParam}`
                      );
                    }}
                    className="flex items-center gap-1.5 min-w-[110px] bg-amber-600 hover:bg-amber-700"
                  >
                    <ClipboardList size={14} />
                    Mid Test
                  </Button>
                ) : slideIndex === totalSlides - 1 ? (
                  <Button
                    size="sm"
                    onClick={handleNextChapter}
                    className="flex items-center gap-1.5 min-w-[110px]"
                  >
                    Next Chapter
                    <ChevronRight size={14} />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="flex items-center gap-1.5 min-w-[90px]"
                  >
                    Next
                    <ChevronRight size={14} />
                  </Button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CourseLearner;
