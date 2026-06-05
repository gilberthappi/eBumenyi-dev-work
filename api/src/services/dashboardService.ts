import { prisma } from "../utils/client";
import { CourseService } from "./courseService";
import { Server as SocketIOServer } from "socket.io";

export class DashboardService {
  /**
   * Handle real-time course enrollment event
   */
  public static async onStudentEnrollment(
    io: SocketIOServer,
    studentId: string,
    courseId: string,
  ) {
    try {
      // Get the enrollment details
      const enrollment = await prisma.courseProgress.findFirst({
        where: {
          studentId,
          courseId,
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          course: true,
        },
      });

      if (enrollment) {
        // Create activity object
        const activity = {
          id: `enrollment_${enrollment.id}`,
          userId: enrollment.student.userId,
          userName: enrollment.student.user.fullNames,
          userPhoto: enrollment.student.user.photo,
          action: "enrolled",
          description: `Enrolled in ${enrollment.course.title}`,
          timestamp: enrollment.createdAt,
          type: "enrollment",
        };

        // Broadcast the new activity to admins and staff
        io.to("ADMIN").to("STAFF").emit("new_activity", activity);

        // Broadcast updated dashboard statistics
        await CourseService.broadcastDashboardStats(io);
      }
    } catch (error) {
      console.error("Error handling student enrollment event:", error);
    }
  }

  /**
   * Handle real-time course completion event
   */
  public static async onCourseCompletion(
    io: SocketIOServer,
    studentId: string,
    courseId: string,
  ) {
    try {
      // Get the completion details
      const completion = await prisma.courseProgress.findFirst({
        where: {
          studentId,
          courseId,
          isCompleted: true,
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          course: true,
        },
      });

      if (completion) {
        // Create activity object
        const activity = {
          id: `completion_${completion.id}`,
          userId: completion.student.userId,
          userName: completion.student.user.fullNames,
          userPhoto: completion.student.user.photo,
          action: "completed",
          description: `Completed ${completion.course.title} course`,
          timestamp: completion.updatedAt,
          type: "completion",
        };

        // Broadcast the new activity to admins and staff
        io.to("ADMIN").to("STAFF").emit("new_activity", activity);

        // Broadcast updated dashboard statistics
        await CourseService.broadcastDashboardStats(io);

        // Send congratulations notification to the student
        io.to(completion.student.userId).emit("notification", {
          title: "Congratulations! 🎉",
          message: `You have successfully completed ${completion.course.title}!`,
          type: "success",
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error("Error handling course completion event:", error);
    }
  }

  /**
   * Handle real-time course creation event
   */
  public static async onCourseCreated(io: SocketIOServer, courseId: string) {
    try {
      // Get the course details
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          staff: {
            include: {
              user: true,
            },
          },
        },
      });

      if (course) {
        // Create activity object
        const activity = {
          id: `course_created_${course.id}`,
          userId: course.staff.userId,
          userName: course.staff.user.fullNames,
          userPhoto: course.staff.user.photo,
          action: "created",
          description: `Created new course: ${course.title}`,
          timestamp: course.createdAt,
          type: "course_creation",
        };

        // Broadcast the new activity to admins and staff
        io.to("ADMIN").to("STAFF").emit("new_activity", activity);

        // Broadcast updated dashboard statistics
        await CourseService.broadcastDashboardStats(io);

        // Notify all students about new course availability
        io.to("STUDENT").emit("notification", {
          title: "New Course Available! 📚",
          message: `A new course "${course.title}" has been published and is now available for enrollment.`,
          type: "info",
          actionUrl: `/courses/${course.id}`,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error("Error handling course creation event:", error);
    }
  }

  /**
   * Get real-time dashboard statistics for specific user roles
   */
  public static async sendDashboardStatsToUser(
    io: SocketIOServer,
    userId: string,
  ) {
    try {
      const stats = await CourseService.getDashboardStatistics();
      io.to(userId).emit("dashboard_stats", stats.data);
    } catch (error) {
      console.error("Error sending dashboard stats to user:", error);
    }
  }

  /**
   * Initialize dashboard real-time listeners
   */
  public static initializeDashboardListeners(io: SocketIOServer) {
    // Listen for dashboard stats requests
    io.on("connection", (socket) => {
      socket.on("request_dashboard_stats", async () => {
        try {
          const user = socket.data.user;
          if (
            user &&
            (user.userRoles.includes("ADMIN") ||
              user.userRoles.includes("STAFF"))
          ) {
            await this.sendDashboardStatsToUser(io, user.id);
          }
        } catch (error) {
          console.error("Error handling dashboard stats request:", error);
        }
      });

      // Listen for real-time activity feed requests
      socket.on("request_recent_activities", async () => {
        try {
          const user = socket.data.user;
          if (
            user &&
            (user.userRoles.includes("ADMIN") ||
              user.userRoles.includes("STAFF"))
          ) {
            const stats = await CourseService.getDashboardStatistics();
            socket.emit("recent_activities", stats.data.recentActivities);
          }
        } catch (error) {
          console.error("Error handling recent activities request:", error);
        }
      });
    });
  }
}
