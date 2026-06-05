/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CreateHospitalDto,
  UpdateHospitalDto,
} from "../utils/interfaces/common";
import { prisma } from "../utils/client";
import AppError from "../utils/error";
import { UserService } from "./userService";
import * as XLSX from "xlsx";

const VALID_SORT_FIELDS: Record<string, string> = {
  name: "name",
  province: "province",
  district: "district",
  totalChws: "totalChws",
  activeChws: "activeChws",
  createdAt: "createdAt",
};

const PROVINCE_ALIASES: Record<string, string> = {
  east: "Eastern",
  eastern: "Eastern",
  west: "Western",
  western: "Western",
  north: "Northern",
  northern: "Northern",
  south: "Southern",
  southern: "Southern",
  "kigali city": "Kigali",
  kigali: "Kigali",
};

function normalizeProvince(raw: string): string {
  return PROVINCE_ALIASES[raw.trim().toLowerCase()] ?? raw.trim();
}

export class HospitalService {
  public static async createHospital(data: CreateHospitalDto) {
    const hospital = await prisma.hospital.create({
      data: {
        name: data.name,
        province: data.province,
        district: data.district,
        sector: data.sector,
        cell: data.cell,
        village: data.village,
        contact: data.contact,
        email: data.email,
        chwSupervisor: data.chwSupervisor,
        chwSupervisorContact: data.chwSupervisorContact,
        totalChws: data.totalChws ?? 0,
        activeChws: data.activeChws ?? 0,
        catchmentArea: data.catchmentArea as any,
      },
    });

    return {
      message: "Hospital created successfully",
      statusCode: 201,
      data: hospital,
    };
  }

  public static async getHospitals(
    searchq?: string,
    limit?: number,
    page?: number,
    sortBy?: string,
    order?: string,
    province?: string,
  ) {
    const where: any = {};
    if (searchq) {
      where.OR = [
        { name: { contains: searchq, mode: "insensitive" } },
        { province: { contains: searchq, mode: "insensitive" } },
        { district: { contains: searchq, mode: "insensitive" } },
      ];
    }
    if (province) {
      where.province = { equals: province, mode: "insensitive" };
    }

    const take = limit ?? 15;
    const skip = page && page > 0 ? (page - 1) * take : 0;
    const sortField = VALID_SORT_FIELDS[sortBy ?? ""] ?? "createdAt";
    const sortOrder = order === "asc" ? "asc" : "desc";

    const hospitals = await prisma.hospital.findMany({
      where,
      take,
      skip,
      orderBy: { [sortField]: sortOrder },
    });

    // Update activeChws and totalChws for each hospital
    await Promise.all(
      hospitals.map(async (hospital) => {
        const userStats = await UserService.getActiveInactiveUsers(hospital.id);
        await prisma.hospital.update({
          where: { id: hospital.id },
          data: {
            activeChws: userStats.activeCount,
            totalChws: userStats.activeCount + userStats.inactiveCount,
          },
        });
        // Update the hospital object in the array
        hospital.activeChws = userStats.activeCount;
        hospital.totalChws = userStats.activeCount + userStats.inactiveCount;
      }),
    );

    const totalItems = await prisma.hospital.count({ where });

    return {
      message: "Hospitals fetched successfully",
      statusCode: 200,
      data: hospitals,
      totalItems,
      currentPage: page || 1,
      itemsPerPage: take,
    };
  }

  public static async getHospitalById(id: string) {
    const hospital = await prisma.hospital.findUnique({
      where: { id },
    });

    if (!hospital) {
      throw new AppError("Hospital not found", 404);
    }

    // Update activeChws and totalChws for the hospital
    const userStats = await UserService.getActiveInactiveUsers(hospital.id);
    await prisma.hospital.update({
      where: { id: hospital.id },
      data: {
        activeChws: userStats.activeCount,
        totalChws: userStats.activeCount + userStats.inactiveCount,
      },
    });
    // Update the hospital object
    hospital.activeChws = userStats.activeCount;
    hospital.totalChws = userStats.activeCount + userStats.inactiveCount;

    return {
      message: "Hospital fetched successfully",
      statusCode: 200,
      data: hospital,
    };
  }

  public static async updateHospital(id: string, data: UpdateHospitalDto) {
    const existing = await prisma.hospital.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Hospital not found", 404);
    }

    const updated = await prisma.hospital.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        province: data.province ?? existing.province,
        district: data.district ?? existing.district,
        sector: data.sector ?? existing.sector,
        cell: data.cell ?? existing.cell,
        village: data.village ?? existing.village,
        contact: data.contact ?? existing.contact,
        email: data.email ?? existing.email,
        chwSupervisor: data.chwSupervisor ?? existing.chwSupervisor,
        chwSupervisorContact:
          data.chwSupervisorContact ?? existing.chwSupervisorContact,
        totalChws: data.totalChws ?? existing.totalChws,
        activeChws: data.activeChws ?? existing.activeChws,
        catchmentArea: (data.catchmentArea as any) ?? existing.catchmentArea,
      },
    });

    return {
      message: "Hospital updated successfully",
      statusCode: 200,
      data: updated,
    };
  }

  public static async deleteHospital(id: string) {
    const existing = await prisma.hospital.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Hospital not found", 404);
    }

    await prisma.hospital.delete({ where: { id } });

    return {
      message: "Hospital deleted successfully",
      statusCode: 200,
    };
  }

  public static async importHospitals(fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
    });

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const [index, row] of rows.entries()) {
      const rowNum = index + 2;
      const name = (row["facility_name"] ?? row["name"] ?? "")
        .toString()
        .trim();
      const province = normalizeProvince((row["province"] ?? "").toString());
      const district = (row["district"] ?? "").toString().trim();
      const sector = (row["sector"] ?? "").toString().trim();

      if (!name) {
        errors.push(`Row ${rowNum}: missing facility name`);
        continue;
      }

      const existing = await prisma.hospital.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          ...(district
            ? { district: { equals: district, mode: "insensitive" } }
            : {}),
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      try {
        await prisma.hospital.create({
          data: { name, province, district, sector },
        });
        created++;
      } catch {
        errors.push(`Row ${rowNum}: failed to create "${name}"`);
      }
    }

    return {
      statusCode: 200,
      message: `Import complete: ${created} created, ${skipped} skipped`,
      data: { total: rows.length, created, skipped, errors },
    };
  }

  public static async getPublicHospitals(
    district?: string,
    sector?: string,
    cell?: string,
    village?: string,
  ) {
    const hospitals = await prisma.hospital.findMany({
      select: {
        id: true,
        name: true,
        district: true,
        sector: true,
        cell: true,
        village: true,
        catchmentArea: true,
      },
      orderBy: { name: "asc" },
    });

    const match = (
      field: string | null | undefined,
      term: string,
      catchment: string[],
    ) => {
      const t = term.toLowerCase().trim();
      return (
        (field || "").toLowerCase().trim() === t ||
        catchment.some((c) => c.toLowerCase().trim() === t)
      );
    };

    let result = hospitals;
    if (district) {
      result = result.filter((h) =>
        match(h.district, district, h.catchmentArea),
      );
    }
    if (sector) {
      result = result.filter((h) => match(h.sector, sector, h.catchmentArea));
    }
    if (cell) {
      result = result.filter((h) => match(h.cell, cell, h.catchmentArea));
    }
    if (village) {
      result = result.filter((h) => match(h.village, village, h.catchmentArea));
    }

    return {
      message: "Hospitals fetched successfully",
      statusCode: 200,
      data: result,
    };
  }

  public static async getAllHospitals(searchq?: string) {
    const where: any = {};
    if (searchq) {
      where.OR = [
        { name: { contains: searchq, mode: "insensitive" } },
        { province: { contains: searchq, mode: "insensitive" } },
        { district: { contains: searchq, mode: "insensitive" } },
      ];
    }

    const hospitals = await prisma.hospital.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Update activeChws and totalChws for each hospital
    await Promise.all(
      hospitals.map(async (hospital) => {
        const userStats = await UserService.getActiveInactiveUsers(hospital.id);
        await prisma.hospital.update({
          where: { id: hospital.id },
          data: {
            activeChws: userStats.activeCount,
            totalChws: userStats.activeCount + userStats.inactiveCount,
          },
        });
        // Update the hospital object in the array
        hospital.activeChws = userStats.activeCount;
        hospital.totalChws = userStats.activeCount + userStats.inactiveCount;
      }),
    );

    return {
      message: "Hospitals fetched successfully",
      statusCode: 200,
      data: hospitals,
    };
  }
}
