import { prisma } from "../utils/db";
import AppError from "../utils/error";
import { TCertificateResponse } from "../utils/interfaces/common";
import { Prisma } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as fs from "fs";
import { NotificationHelper } from "../utils/notificationHelper";

export class CertificateService {
  // Helper: Format date to Kinyarwanda format
  private static formatDateToKinyarwanda(date: Date): string {
    const months = [
      "Mutarama", // January
      "Gashyantare", // February
      "Werurwe", // March
      "Mata", // April
      "Gicurasi", // May
      "Kamena", // June
      "Nyakanga", // July
      "Kanama", // August
      "Nzeri", // September
      "Ukwakira", // October
      "Ugushyingo", // November
      "Ukuboza", // December
    ];

    const day = date.getDate().toString().padStart(2, "0");
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  }

  private static formatDateField(date?: Date | string | null): string | null {
    if (!date) return null;

    const parsedDate = date instanceof Date ? date : new Date(date);
    if (isNaN(parsedDate.getTime())) return null;

    return this.formatDateToKinyarwanda(parsedDate);
  }

  // Helper: Generate PDF certificate with custom content
  private static async generateCertificatePDF(
    studentName: string,
    courseTitle: string,
    completionDate: string,
  ): Promise<Buffer> {
    try {
      // Load the PDF template
      const templateBytes = await fs.promises.readFile(
        "./templates/certificate_template.pdf",
      );
      const pdfDoc = await PDFDocument.load(templateBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      // Embed fonts
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

      // ===== STUDENT NAME =====
      // Coordinates: x=400, y=325
      // Font: HelveticaBold, Size: 26px
      // Handling: truncate, Color: #000000
      // Width Multiplier: 0.5
      // IMPORTANT: Single line only - name should never wrap to multiple lines
      const nameX = 400;
      const nameY = 325;
      const nameFontSize = 26;

      // Calculate text width for proper centering (expanding equally left and right from center)
      const nameWidth = studentName.length * nameFontSize * 0.5;
      const nameDrawX = nameX - nameWidth / 2;

      firstPage.drawText(studentName, {
        x: nameDrawX,
        y: nameY,
        size: nameFontSize,
        color: rgb(0, 0, 0), // #000000
        font: helveticaBold,
        maxWidth: 800, // Large maxWidth to prevent wrapping - name stays on one line
      });
      // ===== COURSE TITLE =====
      // Coordinates: x=350, y=220
      // Font: HelveticaBold, Size: 18px
      // Handling: wrap, Color: #335c9d
      // Width Multiplier: 0.5
      const courseX = 400;
      const courseY = 220;
      const courseFontSize = 18;
      const courseLineHeight = 25;
      const courseMaxWidth = 589; // 70% content width
      const courseWidthMultiplier = 0.5;

      // Function to wrap text with width multiplier
      function wrapTextWithMultiplier(
        text: string,
        maxWidth: number,
        fontSize: number,
        multiplier: number,
      ): string[] {
        const words = text.split(" ");
        const lines: string[] = [];
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine ? currentLine + " " + word : word;
          const testWidth = testLine.length * fontSize * multiplier;

          if (testWidth <= maxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              lines.push(word);
            }
          }
        }

        if (currentLine) {
          lines.push(currentLine);
        }

        return lines;
      }

      // Wrap course title
      const courseLines = wrapTextWithMultiplier(
        courseTitle,
        courseMaxWidth,
        courseFontSize,
        courseWidthMultiplier,
      );

      // Calculate starting Y position - y=220 is the position of the first line
      // For wrapped text with multiple lines, each line goes DOWN (decreasing y values)
      const courseStartY = courseY;

      // Draw each line of course title
      courseLines.forEach((line, index) => {
        const lineWidth = line.length * courseFontSize * courseWidthMultiplier;
        const courseDrawX = courseX - lineWidth / 2;

        firstPage.drawText(line, {
          x: courseDrawX,
          y: courseStartY - index * courseLineHeight,
          size: courseFontSize,
          color: rgb(0.2, 0.36, 0.62), // #335c9d
          font: helveticaBold,
        });
      });

      // ===== COMPLETION DATE =====
      // Coordinates: x=420, y=140
      // Font: TimesBold, Size: 16px
      // Handling: truncate, Color: #4e4646
      // Width Multiplier: 0.5
      const dateX = 420;
      const dateY = 140;
      const dateFontSize = 16;
      const dateWidthMultiplier = 0.5;

      // Calculate text width for proper centering
      const dateWidth =
        completionDate.length * dateFontSize * dateWidthMultiplier;
      const dateDrawX = dateX - dateWidth / 2;

      firstPage.drawText(completionDate, {
        x: dateDrawX,
        y: dateY,
        size: dateFontSize,
        color: rgb(0.31, 0.27, 0.27), // #4e4646
        font: timesBold,
        maxWidth: 300,
      });

      // Save and return the modified PDF
      const generatedPdfBytes = await pdfDoc.save();
      return Buffer.from(generatedPdfBytes);
    } catch (error) {
      console.error("Error generating certificate PDF:", error);
      throw new AppError(
        `Failed to generate certificate PDF: ${String(error)}`,
        500,
      );
    }
  }

  // Helper: upload PDF buffer to Cloudinary and return the secure URL
  private static async uploadPdfToCloudinary(
    pdfBuffer: Buffer,
    fileName: string,
  ): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw", // For PDF files
            folder: "chw/certificates",
            public_id: fileName,
            format: "pdf",
          },
          (error, result) => {
            if (error) {
              reject(
                new AppError(
                  `Failed to upload PDF to Cloudinary: ${error.message}`,
                  500,
                ),
              );
            } else {
              resolve(result?.secure_url || result?.url || "");
            }
          },
        );
        uploadStream.end(pdfBuffer);
      });
    } catch (err) {
      throw new AppError(
        `Failed to upload PDF to Cloudinary: ${String(err)}`,
        500,
      );
    }
  }

  // Helper: Get first time final exam pass date for a student and course
  private static async getFirstFinalExamPassDate(
    studentId: string,
    courseId: string,
  ): Promise<Date> {
    // Get final exam for the course
    const finalExam = await prisma.finalExam.findFirst({
      where: { courseId },
    });

    if (!finalExam) {
      throw new AppError("No final exam found for this course", 404);
    }

    // Find the first successful attempt (passed) for this student and final exam
    const firstPassedAttempt = await prisma.attempTest.findFirst({
      where: {
        studentId,
        finalExamId: finalExam.id,
        marks: { gte: finalExam.marksToPass },
        isCompleted: true,
      },
      orderBy: { createdAt: "asc" }, // First attempt that passed
    });

    if (!firstPassedAttempt) {
      throw new AppError(
        "Student has not passed the final exam for this course",
        400,
      );
    }

    return firstPassedAttempt.createdAt;
  }

  // Helper: Extract Cloudinary public_id from a secure URL
  private static extractCloudinaryPublicId(url: string): string {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) {
      throw new AppError("Invalid Cloudinary URL format", 500);
    }
    const afterUpload = url.substring(uploadIndex + 8);
    return afterUpload.replace(/^v\d+\//, "");
  }

  // Helper: Get course completion date for a student and course
  private static async getCourseCompletionDate(
    studentId: string,
    courseId: string,
  ): Promise<Date | null> {
    // Find the last completed slide for this course
    const lastCompletedSlide = await prisma.slideProgress.findFirst({
      where: {
        studentId,
        isCompleted: true,
        slide: {
          chapter: {
            section: { courseId },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });

    return lastCompletedSlide?.updatedAt || null;
  }


  public static async generateCertificate(studentId: string, courseId: string, io?: any) {
    // Validate student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            fullNames: true,
          },
        },
      },
    });

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    // Validate course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        title: true,
      },
    });

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Check if certificate already exists
    const existingCertificate = await prisma.certificate.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (existingCertificate) {
      throw new AppError(
        "Certificate already exists for this student and course",
        400,
      );
    }

    // Get first time final exam pass date
    const completionDate = await this.getFirstFinalExamPassDate(
      studentId,
      courseId,
    );

    // Generate PDF certificate
    const pdfBuffer = await this.generateCertificatePDF(
      student.user.fullNames,
      course.title,
      this.formatDateToKinyarwanda(completionDate),
    );

    // Upload PDF to Cloudinary
    const fileName = `certificate_${studentId}_${courseId}_${Date.now()}`;
    const pdfUrl = await this.uploadPdfToCloudinary(pdfBuffer, fileName);

    // Save certificate to database
    const certificate = await prisma.certificate.create({
      data: {
        studentId,
        courseId,
        pdf: pdfUrl,
      },
    });

    // ── Notify student that their certificate is ready ─────────────────────
    if (io && student.user.id) {
      try {
        await NotificationHelper.sendToUser(
          io,
          student.user.id,
          `Icyemezo cyawe cyatanzwe: "${course.title}"`,
          `Icyemezo cyawe kirateguwe. Basura ahabigenewe urebe PDF yawe.`,
          "success",
          `/certificate`,
          "certificate",
          certificate.id,
          { courseTitle: course.title, courseId },
          0, // no cooldown — certificate is issued once
        );
      } catch (notifErr) {
        console.warn("[CertificateService] Certificate notification failed:", notifErr);
      }
    }

    return {
      message: "Certificate generated successfully",
      statusCode: 201,
      data: certificate,
    } as {
      message: string;
      statusCode: number;
      data: TCertificateResponse;
    };
  }

  public static async getAllCertificates(
    searchq?: string,
    limit?: number,
    currentPage?: number,
  ) {
    const where: Prisma.CertificateWhereInput = {};

    if (searchq) {
      where.OR = [
        {
          student: {
            user: {
              fullNames: { contains: searchq, mode: "insensitive" },
            },
          },
        },
        {
          course: {
            title: { contains: searchq, mode: "insensitive" },
          },
        },
      ];
    }

    const take = limit ?? 15;
    const skip = currentPage && currentPage > 0 ? (currentPage - 1) * take : 0;

    const certificates = await prisma.certificate.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                fullNames: true,
                phoneNumber: true,
                district: true,
                sector: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            coverIcon: true,
          },
        },
      },
    });

    const totalItems = await prisma.certificate.count({ where });

    return {
      message: "Certificates fetched successfully",
      statusCode: 200,
      data: certificates,
      totalItems,
      currentPage: currentPage || 1,
      itemsPerPage: take,
    };
  }

  public static async getMyCertificates(studentId: string) {
    // Validate student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    const certificates = await prisma.certificate.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            coverIcon: true,
            description: true,
          },
        },
      },
    });

    // Transform certificates to the desired format
    const transformedCertificates = await Promise.all(
      certificates.map(async (certificate) => {
        const courseId = certificate.course.id;

        // Get course progress
        const courseProgress = await prisma.courseProgress.findFirst({
          where: {
            studentId,
            courseId,
          },
        });

        // Get enrollment date (when course progress was created)
        const enrollmentDate = courseProgress?.createdAt || null;

        // Get completion date (when course was completed)
        const completedAt = courseProgress?.isCompleted
          ? await this.getCourseCompletionDate(studentId, courseId)
          : null;

        // Get number of slides in the course
        const slidesCount = await prisma.slide.count({
          where: {
            chapter: {
              section: { courseId },
            },
          },
        });

        // Get number of test attempts
        const attemptsCount = await prisma.attempTest.count({
          where: {
            studentId,
            OR: [
              { preTest: { courseId } },
              { midTest: { chapter: { section: { courseId } } } },
              { finalTest: { courseId } },
              { finalExam: { courseId } },
            ],
          },
        });

        // Get number of tests
        const testsCount =
          (await prisma.preTest.count({ where: { courseId } })) +
          (await prisma.midTest.count({
            where: { chapter: { section: { courseId } } },
          })) +
          (await prisma.finalTest.count({ where: { courseId } })) +
          (await prisma.finalExam.count({ where: { courseId } }));

        // Get final exam marks
        const finalExamAttempt = await prisma.attempTest.findFirst({
          where: {
            studentId,
            finalExam: { courseId },
            isCompleted: true,
          },
          orderBy: { marks: "desc" },
        });

        const finalExamMarks = finalExamAttempt?.marks || null;

        return {
          id: certificate.id,
          courseId,
          title: certificate.course.title,
          image: certificate.course.coverIcon,
          progress: courseProgress?.progress || 0,
          enrollmentDate: this.formatDateField(enrollmentDate),
          completedAt: this.formatDateField(completedAt),
          enrollmentDateRaw: enrollmentDate,
          completedAtRaw: completedAt,
          enrollmentDateKinyarwanda: this.formatDateField(enrollmentDate),
          completedAtKinyarwanda: this.formatDateField(completedAt),
          slides: slidesCount,
          attempt: attemptsCount,
          test: testsCount,
          finalExamMarks,
          pdf: certificate.pdf,
        };
      }),
    );

    return {
      message: "My certificates fetched successfully",
      statusCode: 200,
      data: transformedCertificates,
    };
  }

  public static async getMyCertificateByCourseId(
    studentId: string,
    courseId: string,
  ) {
    // Validate student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    // Validate course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    const certificate = await prisma.certificate.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            coverIcon: true,
            description: true,
          },
        },
      },
    });

    if (!certificate) {
      throw new AppError(
        "Certificate not found for this student and course",
        404,
      );
    }

    return {
      message: "Certificate fetched successfully",
      statusCode: 200,
      data: certificate,
    };
  }

  public static async getCertificateById(certificateId: string) {
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                fullNames: true,
                phoneNumber: true,
                district: true,
                sector: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            coverIcon: true,
            description: true,
          },
        },
      },
    });

    if (!certificate) {
      throw new AppError("Certificate not found", 404);
    }

    return {
      message: "Certificate fetched successfully",
      statusCode: 200,
      data: certificate,
    };
  }

  public static async regenerateCertificate(certificateId: string) {
    // Step 1: Find existing certificate
    const existingCertificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
    });

    if (!existingCertificate) {
      throw new AppError("Certificate not found", 404);
    }

    const { studentId, courseId } = existingCertificate;

    // Step 2: Fetch student and course
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: { fullNames: true },
        },
      },
    });

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { title: true },
    });

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Step 3: Re-fetch original completion date
    const completionDate = await this.getFirstFinalExamPassDate(studentId, courseId);

    // Step 4: Generate new PDF with current template
    const pdfBuffer = await this.generateCertificatePDF(
      student.user.fullNames,
      course.title,
      this.formatDateToKinyarwanda(completionDate),
    );

    // Step 5: Delete old Cloudinary file
    const oldPublicId = this.extractCloudinaryPublicId(existingCertificate.pdf);
    await cloudinary.uploader.destroy(oldPublicId, { resource_type: "raw" });

    // Step 6: Upload new PDF
    const fileName = `certificate_${studentId}_${courseId}_${Date.now()}`;
    const pdfUrl = await this.uploadPdfToCloudinary(pdfBuffer, fileName);

    // Step 7: Update DB record
    const certificate = await prisma.certificate.update({
      where: { id: certificateId },
      data: { pdf: pdfUrl },
    });

    return {
      message: "Certificate regenerated successfully",
      statusCode: 200,
      data: certificate,
    } as {
      message: string;
      statusCode: number;
      data: TCertificateResponse;
    };
  }

  public static async generateTestCertificate(
    studentId: string,
    courseId: string,
    completionDate: string,
  ) {
    // Validate student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            fullNames: true,
          },
        },
      },
    });

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    // Validate course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        title: true,
      },
    });

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Generate PDF certificate with provided date (no validation on duplicate)
    const pdfBuffer = await this.generateCertificatePDF(
      student.user.fullNames,
      course.title,
      completionDate,
    );

    // Upload PDF to Cloudinary
    const fileName = `certificate_${studentId}_${courseId}_${Date.now()}`;
    const pdfUrl = await this.uploadPdfToCloudinary(pdfBuffer, fileName);

    // Save certificate to database
    const certificate = await prisma.certificate.create({
      data: {
        studentId,
        courseId,
        pdf: pdfUrl,
      },
    });

    return {
      message: "Test certificate generated successfully",
      statusCode: 201,
      data: certificate,
    } as {
      message: string;
      statusCode: number;
      data: TCertificateResponse;
    };
  }
}
