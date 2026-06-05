import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EMOJI_DATA: { title: string; data: any[] }[] = require('./emojis.json');

const RECENT_KEY = 'emoji_recent_v2';
const SKIN_TONE_KEY = 'emoji_skin_tones';
const COLUMNS = 8;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EMOJI_SIZE = Math.floor((SCREEN_WIDTH - 16) / COLUMNS);
const SEARCH_HEIGHT = 96; // strip + search bar

const CATEGORY_ICONS: Record<string, string> = {
  recently_used: '🕐',
  smileys_emotion: '😀',
  people_body: '👋',
  animals_nature: '🐶',
  food_drink: '🍔',
  travel_places: '✈️',
  activities: '⚽',
  objects: '💡',
  symbols: '🔣',
  flags: '🏁',
};

const CATEGORY_NAMES: Record<string, string> = {
  recently_used: 'Byakoreshejwe',
  smileys_emotion: 'Ibirimo',
  people_body: 'Abantu',
  animals_nature: 'Inyamaswa',
  food_drink: 'Ibyokurya',
  travel_places: 'Ingendo',
  activities: 'Ibikorwa',
  objects: 'Ibintu',
  symbols: 'Ibimenyetso',
  flags: 'Ibendera',
};

interface EmojiPickerProps {
  open: boolean;
  onClose: () => void;
  onEmojiSelected: (emoji: string) => void;
  onBackspace: () => void;
  pickerHeight?: number;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export default function EmojiPicker({
  open,
  onClose,
  onEmojiSelected,
  onBackspace,
  pickerHeight = 320,
}: EmojiPickerProps) {
  const [search, setSearch] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState('recently_used');
  const [skinToneTarget, setSkinToneTarget] = useState<any>(null);
  const [recent, setRecent] = useState<
    { emoji: string; count: number; lastUsed: number }[]
  >([]);
  const [tones, setTonesState] = useState<Record<string, number>>({});
  const listRef = useRef<SectionList>(null);
  const catScrollRef = useRef<ScrollView>(null);
  const searchInputRef = useRef<TextInput>(null);
  const backspaceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(pickerHeight)).current;
  const slideAnim = useRef(new Animated.Value(pickerHeight)).current;

  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then((raw) => {
      if (raw) {
        try {
          setRecent(JSON.parse(raw));
        } catch {}
      }
    });
    AsyncStorage.getItem(SKIN_TONE_KEY).then((raw) => {
      if (raw) {
        try {
          setTonesState(JSON.parse(raw));
        } catch {}
      }
    });
  }, []);

  // Fade in/out when picker opens/closes
  useEffect(() => {
    if (open) {
      setSearch('');
      setSearchMode(false);
      slideAnim.setValue(pickerHeight);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(pickerHeight);
      setSearch('');
      setSearchMode(false);
    }
  }, [open, pickerHeight, fadeAnim, slideAnim]);

  // Shrink/expand height when entering/leaving search mode
  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: searchMode ? SEARCH_HEIGHT : pickerHeight,
      duration: 150,
      useNativeDriver: false, // height cannot use native driver
    }).start();
    if (searchMode) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [searchMode, pickerHeight, heightAnim]);

  const exitSearch = useCallback(() => {
    setSearch('');
    setSearchMode(false);
    searchInputRef.current?.blur();
  }, []);

  const addRecent = useCallback(async (emoji: string) => {
    setRecent((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      let next;
      if (existing) {
        next = prev.map((r) =>
          r.emoji === emoji
            ? { ...r, count: r.count + 1, lastUsed: Date.now() }
            : r,
        );
      } else {
        next = [...prev, { emoji, count: 1, lastUsed: Date.now() }];
      }
      next = next
        .sort(
          (a, b) =>
            b.count * 0.7 +
            (b.lastUsed / 1e12) * 0.3 -
            (a.count * 0.7 + (a.lastUsed / 1e12) * 0.3),
        )
        .slice(0, 36);
      AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setTone = useCallback(async (emojiName: string, idx: number) => {
    setTonesState((prev) => {
      const next = { ...prev, [emojiName]: idx };
      AsyncStorage.setItem(SKIN_TONE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const sections = useMemo(() => {
    const cats = [];
    if (recent.length > 0) {
      cats.push({
        title: 'recently_used',
        data: chunkArray(
          recent.map((r) => ({
            emoji: r.emoji,
            name: r.emoji,
            toneEnabled: false,
            keywords: [],
            tones: [],
          })),
          COLUMNS,
        ),
      });
    }
    for (const cat of EMOJI_DATA) {
      cats.push({ title: cat.title, data: chunkArray(cat.data, COLUMNS) });
    }
    return cats;
  }, [recent]);

  // Flat list for horizontal strip in search mode
  const searchResultsFlat = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    const results: any[] = [];
    for (const cat of EMOJI_DATA) {
      for (const e of cat.data) {
        if (
          e.name.toLowerCase().includes(q) ||
          e.keywords.some((k: string) => k.includes(q))
        ) {
          results.push(e);
        }
      }
    }
    return results;
  }, [search]);

  const handleEmojiPress = useCallback(
    (item: any) => {
      const toneIdx = tones[item.name] || 0;
      const finalEmoji =
        toneIdx > 0 && item.toneEnabled && item.tones && item.tones[toneIdx]
          ? item.tones[toneIdx]
          : item.emoji;
      onEmojiSelected(finalEmoji);
      addRecent(finalEmoji);
      setSkinToneTarget(null);
    },
    [tones, onEmojiSelected, addRecent],
  );

  const handleEmojiLongPress = useCallback((item: any) => {
    if (!item.toneEnabled || !item.tones || item.tones.length === 0) return;
    setSkinToneTarget(item);
  }, []);

  const handleBackspaceDown = useCallback(() => {
    onBackspace();
    let delay = 150;
    const fire = () => {
      onBackspace();
      delay = Math.max(40, delay - 15);
      backspaceTimer.current = setTimeout(fire, delay);
    };
    backspaceTimer.current = setTimeout(fire, 500);
  }, [onBackspace]);

  const handleBackspaceUp = useCallback(() => {
    if (backspaceTimer.current) {
      clearTimeout(backspaceTimer.current);
      backspaceTimer.current = null;
    }
  }, []);

  const scrollToCategory = useCallback(
    (title: string) => {
      setActiveCategory(title);
      const idx = sections.findIndex((sec) => sec.title === title);
      if (idx >= 0 && listRef.current) {
        listRef.current.scrollToLocation({
          sectionIndex: idx,
          itemIndex: 0,
          animated: true,
          viewPosition: 0,
        });
      }
    },
    [sections],
  );

  const renderItem = useCallback(
    ({ item: row }: { item: any[] }) => (
      <View style={s.row}>
        {row.map((item: any, i: number) => (
          <Pressable
            key={`${item.emoji}_${i}`}
            style={s.emojiBtn}
            onPress={() => handleEmojiPress(item)}
            onLongPress={() => handleEmojiLongPress(item)}
            delayLongPress={400}
          >
            <Text style={s.emojiText}>{item.emoji}</Text>
          </Pressable>
        ))}
        {Array.from({ length: COLUMNS - row.length }).map((_, i) => (
          <View key={`empty_${i}`} style={s.emojiBtn} />
        ))}
      </View>
    ),
    [handleEmojiPress, handleEmojiLongPress],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: any }) => (
      <View style={s.sectionHeader}>
        <Text style={s.sectionHeaderText}>
          {CATEGORY_NAMES[section.title] || section.title}
        </Text>
      </View>
    ),
    [],
  );

  if (!open) return null;

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <Animated.View style={[s.container, { height: heightAnim }]}>
        {searchMode ? (
          // ── SEARCH MODE: horizontal results strip + search bar ──
          <>
            {/* Horizontal emoji results strip */}
            <View style={s.strip}>
              {search.trim() && searchResultsFlat.length === 0 ? (
                <Text style={s.stripEmpty}>Nta bisubizo...</Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.stripContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {searchResultsFlat.map((item: any, i: number) => (
                    <TouchableOpacity
                      key={`${item.emoji}_${i}`}
                      style={s.stripBtn}
                      onPress={() => handleEmojiPress(item)}
                    >
                      <Text style={s.emojiText}>{item.emoji}</Text>
                    </TouchableOpacity>
                  ))}
                  {!search.trim() && (
                    <Text style={s.stripEmpty}>Andika gushaka...</Text>
                  )}
                </ScrollView>
              )}
            </View>

            {/* Search bar */}
            <View style={s.searchBar}>
              <TouchableOpacity
                onPress={exitSearch}
                style={s.searchBackBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={s.searchBackText}>←</Text>
              </TouchableOpacity>
              <TextInput
                ref={searchInputRef}
                style={s.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Shakira..."
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearch('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={s.searchClearText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          // ── BROWSE MODE: full grid + category bar ──
          <>
            {/* Top bar */}
            <View style={s.topRow}>
              <TouchableOpacity
                style={s.searchPill}
                activeOpacity={0.7}
                onPress={() => setSearchMode(true)}
              >
                <Text style={s.searchPillIcon}>🔍</Text>
                <Text style={s.searchPillPlaceholder}>Shakira...</Text>
              </TouchableOpacity>
              <Pressable
                style={s.backspaceBtn}
                onPressIn={handleBackspaceDown}
                onPressOut={handleBackspaceUp}
              >
                <Text style={s.backspaceText}>⌫</Text>
              </Pressable>
            </View>

            {/* Emoji grid */}
            <View style={s.gridContainer}>
              <SectionList
                ref={listRef}
                sections={sections}
                keyExtractor={(_row, idx) => `r_${idx}`}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.listContent}
                stickySectionHeadersEnabled={false}
                keyboardShouldPersistTaps="handled"
                onViewableItemsChanged={({ viewableItems }) => {
                  if (
                    viewableItems.length > 0 &&
                    viewableItems[0].section?.title
                  ) {
                    setActiveCategory(viewableItems[0].section.title);
                  }
                }}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              />
            </View>

            {/* Category bar */}
            <View style={s.categoryBar}>
              <ScrollView
                ref={catScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.categoryBarContent}
              >
                {sections.map((cat) => (
                  <TouchableOpacity
                    key={cat.title}
                    onPress={() => scrollToCategory(cat.title)}
                    style={[
                      s.catBtn,
                      activeCategory === cat.title && s.catBtnActive,
                    ]}
                  >
                    <Text style={s.catBtnEmoji}>
                      {CATEGORY_ICONS[cat.title] || '🔣'}
                    </Text>
                    {activeCategory === cat.title && (
                      <View style={s.catActiveLine} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        {/* Skin tone popup */}
        {skinToneTarget && (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSkinToneTarget(null)}
          >
            <View style={s.skinPopup}>
              {(skinToneTarget.tones || [skinToneTarget.emoji]).map(
                (e: string, i: number) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      s.skinToneBtn,
                      tones[skinToneTarget.name] === i && s.skinToneBtnActive,
                    ]}
                    onPress={() => {
                      setTone(skinToneTarget.name, i);
                      onEmojiSelected(e);
                      addRecent(e);
                      setSkinToneTarget(null);
                    }}
                  >
                    <Text style={s.emojiText}>{e}</Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </Pressable>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    overflow: 'hidden',
    flexDirection: 'column',
  },

  // ── Search mode ──
  strip: {
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    justifyContent: 'center',
  },
  stripContent: {
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  stripBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripEmpty: {
    fontSize: 13,
    color: '#9ca3af',
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  searchBackBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBackText: { fontSize: 22, color: '#374151' },
  searchInput: {
    flex: 1,
    height: 34,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 0,
  },
  searchClearText: { fontSize: 16, color: '#9ca3af', paddingHorizontal: 4 },

  // ── Browse mode ──
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 34,
    gap: 6,
  },
  searchPillIcon: { fontSize: 13 },
  searchPillPlaceholder: { fontSize: 14, color: '#9ca3af' },
  backspaceBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backspaceText: { fontSize: 20, color: '#374151' },
  gridContainer: { flex: 1 },
  listContent: { paddingHorizontal: 4, paddingBottom: 4 },
  row: { flexDirection: 'row', paddingHorizontal: 4 },
  emojiBtn: {
    width: EMOJI_SIZE,
    height: EMOJI_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 24 },
  sectionHeader: {
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 2,
    backgroundColor: '#ffffff',
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryBar: {
    height: 46,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    justifyContent: 'center',
  },
  categoryBarContent: { paddingHorizontal: 4, alignItems: 'center' },
  catBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
    position: 'relative',
  },
  catBtnActive: { backgroundColor: '#EFF6FF' },
  catBtnEmoji: { fontSize: 22 },
  catActiveLine: {
    position: 'absolute',
    bottom: 2,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: '#4D81D2',
    borderRadius: 1,
  },

  // ── Skin tone popup ──
  skinPopup: {
    position: 'absolute',
    bottom: 56,
    left: 12,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 6,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  skinToneBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skinToneBtnActive: { backgroundColor: '#EFF6FF' },
});
