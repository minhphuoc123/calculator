import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PackageCode = "VSAT" | "AIO" | "CCTV" | "AV";

const PACKAGE_ORDER: PackageCode[] = ["VSAT", "AIO", "CCTV", "AV"];

function formatCurrency(value: number) {
    return new Intl.NumberFormat("vi-VN").format(Math.round(value));
}

function getMonthRange(year: number, month: number) {
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
}

function drawCell(params: {
    page: ReturnType<PDFDocument["addPage"]>;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    font: any;
    fontSize?: number;
    textColor?: ReturnType<typeof rgb>;
    borderColor?: ReturnType<typeof rgb>;
    center?: boolean;
}) {
    const {
        page,
        x,
        y,
        width,
        height,
        text,
        font,
        fontSize = 10,
        textColor = rgb(0, 0, 0),
        borderColor = rgb(0.7, 0.7, 0.7),
        center = false,
    } = params;

    page.drawRectangle({
        x,
        y,
        width,
        height,
        borderWidth: 1,
        borderColor,
    });

    const safeText = text ?? "";
    const textWidth = font.widthOfTextAtSize(safeText, fontSize);
    const textX = center ? x + (width - textWidth) / 2 : x + 6;
    const textY = y + height / 2 - fontSize / 2 + 2;

    page.drawText(safeText, {
        x: Math.max(textX, x + 4),
        y: textY,
        size: fontSize,
        font,
        color: textColor,
        maxWidth: width - 8,
    });
}

export async function GET(req: Request) {
    try {
        const user = await requireUser();

        const { searchParams } = new URL(req.url);
        const month = Number(searchParams.get("month"));
        const year = Number(searchParams.get("year"));

        if (!month || !year || month < 1 || month > 12) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Tháng hoặc năm không hợp lệ",
                },
                { status: 400 }
            );
        }

        const { start, end } = getMonthRange(year, month);

        const records = await prisma.financialRecord.findMany({
            where: {
                userId: user.id,
                recordDate: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                packageType: {
                    select: {
                        code: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                recordDate: "asc",
            },
        });

        const grouped: Record<
            PackageCode,
            {
                output: number;
                input: number;
                grossProfit: number;
                vat: number;
                corporateTax: number;
                netProfit: number;
            }
        > = {
            VSAT: { output: 0, input: 0, grossProfit: 0, vat: 0, corporateTax: 0, netProfit: 0 },
            AIO: { output: 0, input: 0, grossProfit: 0, vat: 0, corporateTax: 0, netProfit: 0 },
            CCTV: { output: 0, input: 0, grossProfit: 0, vat: 0, corporateTax: 0, netProfit: 0 },
            AV: { output: 0, input: 0, grossProfit: 0, vat: 0, corporateTax: 0, netProfit: 0 },
        };

        for (const record of records) {
            const code = record.packageType.code as PackageCode;
            if (!PACKAGE_ORDER.includes(code)) continue;

            grouped[code].output += Number(record.revenueBeforeVat);
            grouped[code].input += Number(record.costBeforeVat);
            grouped[code].grossProfit += Number(record.grossProfit);
            grouped[code].vat += Number(record.vatAmount);
            grouped[code].corporateTax += Number(record.corporateTaxAmount);
            grouped[code].netProfit += Number(record.netProfit);
        }

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([842, 595]); // A4 landscape gần đúng
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();

        page.drawText("BAO CAO DOANH THU THEO THANG", {
            x: pageWidth / 2 - 140,
            y: pageHeight - 40,
            size: 18,
            font: boldFont,
            color: rgb(0, 0, 0),
        });

        page.drawText(`Thang ${month}/${year}`, {
            x: pageWidth / 2 - 40,
            y: pageHeight - 62,
            size: 11,
            font,
            color: rgb(0.2, 0.2, 0.2),
        });

        const startX = 30;
        const topY = pageHeight - 110;
        const rowHeight = 34;
        const colWidths = [250, 120, 110, 110, 110, 110];

        const headers = ["Danh muc", "Mo ta", "Goi VSAT", "Goi AIO", "Goi CCTV", "Goi AV"];

        const rows = [
            [
                "Dau ra (Doanh thu chua VAT) (1)",
                "",
                formatCurrency(grouped.VSAT.output),
                formatCurrency(grouped.AIO.output),
                formatCurrency(grouped.CCTV.output),
                formatCurrency(grouped.AV.output),
            ],
            [
                "Dau vao (Gia von chua VAT) (2)",
                "",
                formatCurrency(grouped.VSAT.input),
                formatCurrency(grouped.AIO.input),
                formatCurrency(grouped.CCTV.input),
                formatCurrency(grouped.AV.input),
            ],
            [
                "Loi nhuan gop (3)",
                "(3) = (1) - (2)",
                formatCurrency(grouped.VSAT.grossProfit),
                formatCurrency(grouped.AIO.grossProfit),
                formatCurrency(grouped.CCTV.grossProfit),
                formatCurrency(grouped.AV.grossProfit),
            ],
            [
                "VAT phai nop 8% (4)",
                "8%*(3)",
                formatCurrency(grouped.VSAT.vat),
                formatCurrency(grouped.AIO.vat),
                formatCurrency(grouped.CCTV.vat),
                formatCurrency(grouped.AV.vat),
            ],
            [
                "Thue thu nhap doanh nghiep 20% (5)",
                "20%*(3)",
                formatCurrency(grouped.VSAT.corporateTax),
                formatCurrency(grouped.AIO.corporateTax),
                formatCurrency(grouped.CCTV.corporateTax),
                formatCurrency(grouped.AV.corporateTax),
            ],
            [
                "Loi nhuan rong (6)",
                "(6)=(3)-(5)",
                formatCurrency(grouped.VSAT.netProfit),
                formatCurrency(grouped.AIO.netProfit),
                formatCurrency(grouped.CCTV.netProfit),
                formatCurrency(grouped.AV.netProfit),
            ],
        ];

        let currentX = startX;
        headers.forEach((header, index) => {
            drawCell({
                page,
                x: currentX,
                y: topY,
                width: colWidths[index],
                height: rowHeight,
                text: header,
                font: boldFont,
                fontSize: 11,
                textColor: index >= 2 ? rgb(0.82, 0, 0) : rgb(0, 0, 0),
                center: true,
            });
            currentX += colWidths[index];
        });

        rows.forEach((row, rowIndex) => {
            let x = startX;
            const y = topY - rowHeight * (rowIndex + 1);

            row.forEach((cell, colIndex) => {
                drawCell({
                    page,
                    x,
                    y,
                    width: colWidths[colIndex],
                    height: rowHeight,
                    text: cell,
                    font: colIndex === 0 ? font : font,
                    fontSize: 10,
                    center: colIndex >= 1,
                });
                x += colWidths[colIndex];
            });
        });

        page.drawText("Bao cao duoc tao tu dong tu du lieu record theo thang.", {
            x: 30,
            y: 40,
            size: 10,
            font,
            color: rgb(0.35, 0.35, 0.35),
        });

        const pdfBytes = await pdfDoc.save();

        return new Response(Buffer.from(pdfBytes), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="bao-cao-thang-${month}-${year}.pdf"`,
            },
        });
    } catch (error) {
        console.error("MONTHLY_PDF_ERROR:", error);

        if (error instanceof Error && error.message === "UNAUTHORIZED") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Chua dang nhap",
                },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: "Khong the xuat PDF",
                error:
                    process.env.NODE_ENV !== "production"
                        ? error instanceof Error
                            ? error.message
                            : String(error)
                        : undefined,
            },
            { status: 500 }
        );
    }
}