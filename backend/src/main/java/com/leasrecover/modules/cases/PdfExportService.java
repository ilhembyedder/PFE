package com.leasrecover.modules.cases;

import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.cases.dto.CaseResponse;
import com.leasrecover.modules.cases.dto.HistoryEventResponse;
import com.leasrecover.modules.tenant.Tenant;
import com.leasrecover.modules.tenant.TenantRepository;
import com.lowagie.text.*;
import com.lowagie.text.Document;
import com.lowagie.text.pdf.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class PdfExportService {

    private final CaseService caseService;
    private final CaseHistoryService caseHistoryService;
    private final TenantRepository tenantRepository;
    private final RecoveryCaseRepository recoveryCaseRepository;

    public PdfExportService(
            CaseService caseService,
            CaseHistoryService caseHistoryService,
            TenantRepository tenantRepository,
            RecoveryCaseRepository recoveryCaseRepository) {
        this.caseService = caseService;
        this.caseHistoryService = caseHistoryService;
        this.tenantRepository = tenantRepository;
        this.recoveryCaseRepository = recoveryCaseRepository;
    }

    @Transactional(readOnly = true)
    public byte[] generateCasePdf(UUID caseId) {
        // Validate tenant context
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        RecoveryCase rcase = recoveryCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));

        if (!tenantId.equals(rcase.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Case does not belong to active tenant");
        }

        // Gather all data
        CaseResponse caseDetails = caseService.getCase(caseId);
        List<HistoryEventResponse> history = caseHistoryService.getCaseHistory(caseId);

        String tenantName = "LeasRecover Tenant";
        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        if (tenant != null && tenant.getName() != null) {
            tenantName = tenant.getName();
        }

        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String reportDate = ZonedDateTime.now(ZoneId.systemDefault()).format(dateTimeFormatter);

        // Generate PDF
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document pdfDoc = new Document(PageSize.A4, 36, 36, 36, 36);

        try {
            PdfWriter.getInstance(pdfDoc, baos);
            pdfDoc.open();

            // Colors
            Color primaryColor = new Color(44, 62, 80);      // Dark slate blue
            Color secondaryColor = new Color(52, 152, 219);  // Clean blue
            Color lightGray = new Color(245, 246, 250);
            Color textDark = new Color(47, 53, 66);
            Color borderGray = new Color(220, 221, 225);

            // Fonts
            Font headerTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.WHITE);
            Font headerSubtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(220, 221, 225));
            Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, primaryColor);
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, textDark);
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 9, textDark);
            Font tableHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            Font tableCellFont = FontFactory.getFont(FontFactory.HELVETICA, 8, textDark);

            // 1. Professional Header Block
            PdfPTable headerTable = new PdfPTable(1);
            headerTable.setWidthPercentage(100);
            
            PdfPCell headerCell = new PdfPCell();
            headerCell.setBackgroundColor(primaryColor);
            headerCell.setPadding(12);
            headerCell.setBorder(Rectangle.NO_BORDER);

            Paragraph title = new Paragraph("RAPPORT DE RECOUVREMENT - LEASRECOVER", headerTitleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            headerCell.addElement(title);

            Paragraph subtitle = new Paragraph("Généré le: " + reportDate + " | Partenaire: " + tenantName, headerSubtitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingBefore(4);
            headerCell.addElement(subtitle);

            headerTable.addCell(headerCell);
            pdfDoc.add(headerTable);

            // Separator
            Paragraph space = new Paragraph(" ");
            space.setSpacingBefore(10);
            pdfDoc.add(space);

            // 2. Client & Contract section + Vehicle & Financial section
            PdfPTable gridTable = new PdfPTable(2);
            gridTable.setWidthPercentage(100);
            gridTable.setSpacingBefore(10f);
            
            float[] colWidths = {50f, 50f};
            gridTable.setWidths(colWidths);

            // Left Block: Client & Contract
            PdfPCell leftCell = new PdfPCell();
            leftCell.setBorder(Rectangle.NO_BORDER);
            leftCell.setPaddingRight(10f);

            Paragraph leftTitle = new Paragraph("INFORMATIONS CLIENT & CONTRAT", sectionTitleFont);
            leftTitle.setSpacingAfter(6f);
            leftCell.addElement(leftTitle);

            PdfPTable clientTable = new PdfPTable(2);
            clientTable.setWidthPercentage(100);
            clientTable.setWidths(new float[]{40f, 60f});

            addGridRow(clientTable, "Client:", caseDetails.getClient() != null ? caseDetails.getClient().getFullNameOrCompany() : "N/A", labelFont, valueFont, borderGray);
            addGridRow(clientTable, "Identifiant Client:", caseDetails.getClient() != null ? caseDetails.getClient().getRegistrationNumber() : "N/A", labelFont, valueFont, borderGray);
            addGridRow(clientTable, "Email Client:", caseDetails.getClient() != null ? caseDetails.getClient().getContactEmail() : "N/A", labelFont, valueFont, borderGray);
            addGridRow(clientTable, "Contrat Réf:", caseDetails.getContract() != null ? caseDetails.getContract().getReferenceNumber() : "N/A", labelFont, valueFont, borderGray);
            
            String contractDates = "N/A";
            if (caseDetails.getContract() != null && caseDetails.getContract().getStartDate() != null) {
                contractDates = caseDetails.getContract().getStartDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                if (caseDetails.getContract().getEndDate() != null) {
                    contractDates += " - " + caseDetails.getContract().getEndDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                }
            }
            addGridRow(clientTable, "Période Contrat:", contractDates, labelFont, valueFont, borderGray);
            addGridRow(clientTable, "Statut Contrat:", caseDetails.getContract() != null ? caseDetails.getContract().getStatus() : "N/A", labelFont, valueFont, borderGray);

            leftCell.addElement(clientTable);
            gridTable.addCell(leftCell);

            // Right Block: Vehicle & Financial
            PdfPCell rightCell = new PdfPCell();
            rightCell.setBorder(Rectangle.NO_BORDER);
            rightCell.setPaddingLeft(10f);

            Paragraph rightTitle = new Paragraph("VÉHICULE & FINANCES", sectionTitleFont);
            rightTitle.setSpacingAfter(6f);
            rightCell.addElement(rightTitle);

            PdfPTable vehicleTable = new PdfPTable(2);
            vehicleTable.setWidthPercentage(100);
            vehicleTable.setWidths(new float[]{40f, 60f});

            String vehicleInfo = "N/A";
            if (caseDetails.getVehicle() != null) {
                vehicleInfo = caseDetails.getVehicle().getBrand() + " " + caseDetails.getVehicle().getModel();
                if (caseDetails.getVehicle().getYear() != null) {
                    vehicleInfo += " (" + caseDetails.getVehicle().getYear() + ")";
                }
            }
            addGridRow(vehicleTable, "Véhicule:", vehicleInfo, labelFont, valueFont, borderGray);
            addGridRow(vehicleTable, "Immatriculation:", caseDetails.getVehicle() != null ? caseDetails.getVehicle().getLicensePlate() : "N/A", labelFont, valueFont, borderGray);
            addGridRow(vehicleTable, "Numéro VIN:", caseDetails.getVehicle() != null ? caseDetails.getVehicle().getVin() : "N/A", labelFont, valueFont, borderGray);
            
            String financialSum = "0.00 TND";
            if (caseDetails.getInitialResidualValueCents() != null) {
                financialSum = String.format("%.2f %s", caseDetails.getInitialResidualValueCents() / 100.0, 
                        caseDetails.getCurrencyCode() != null ? caseDetails.getCurrencyCode() : "TND");
            }
            addGridRow(vehicleTable, "Valeur Résiduelle:", financialSum, labelFont, valueFont, borderGray);
            addGridRow(vehicleTable, "Phase Actuelle:", caseDetails.getCurrentPhase(), labelFont, valueFont, borderGray);
            addGridRow(vehicleTable, "Gestionnaire:", caseDetails.getAssigneeEmail() != null ? caseDetails.getAssigneeEmail() : "Non assigné", labelFont, valueFont, borderGray);

            rightCell.addElement(vehicleTable);
            gridTable.addCell(rightCell);

            pdfDoc.add(gridTable);

            // Separator
            Paragraph space2 = new Paragraph(" ");
            space2.setSpacingBefore(15);
            pdfDoc.add(space2);

            // 3. Chronological Audit Timeline section
            Paragraph timelineTitle = new Paragraph("HISTORIQUE CHRONOLOGIQUE DES ACTIONS", sectionTitleFont);
            timelineTitle.setSpacingAfter(8f);
            pdfDoc.add(timelineTitle);

            PdfPTable timelineTable = new PdfPTable(4);
            timelineTable.setWidthPercentage(100);
            timelineTable.setWidths(new float[]{16f, 24f, 20f, 40f});

            // Table Headers
            addTableHeaderCell(timelineTable, "Date & Heure", primaryColor, tableHeaderFont);
            addTableHeaderCell(timelineTable, "Acteur / Agent", primaryColor, tableHeaderFont);
            addTableHeaderCell(timelineTable, "Événement", primaryColor, tableHeaderFont);
            addTableHeaderCell(timelineTable, "Description / Détail", primaryColor, tableHeaderFont);

            // Populate rows
            boolean alternate = false;
            for (HistoryEventResponse event : history) {
                Color rowBg = alternate ? lightGray : Color.WHITE;

                String dateStr = event.getTimestamp() != null ? event.getTimestamp().format(dateTimeFormatter) : "N/A";
                addTableCell(timelineTable, dateStr, rowBg, tableCellFont, borderGray);
                addTableCell(timelineTable, event.getActor(), rowBg, tableCellFont, borderGray);
                addTableCell(timelineTable, event.getEventType(), rowBg, tableCellFont, borderGray);
                addTableCell(timelineTable, event.getDescription(), rowBg, tableCellFont, borderGray);

                alternate = !alternate;
            }

            pdfDoc.add(timelineTable);

        } catch (DocumentException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error generating PDF document: " + e.getMessage());
        } finally {
            pdfDoc.close();
        }

        return baos.toByteArray();
    }

    private void addGridRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont, Color borderColor) {
        PdfPCell labelCell = new PdfPCell(new Paragraph(label, labelFont));
        labelCell.setBorder(Rectangle.BOTTOM);
        labelCell.setBorderColor(borderColor);
        labelCell.setPadding(4);
        
        PdfPCell valueCell = new PdfPCell(new Paragraph(value != null ? value : "", valueFont));
        valueCell.setBorder(Rectangle.BOTTOM);
        valueCell.setBorderColor(borderColor);
        valueCell.setPadding(4);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private void addTableHeaderCell(PdfPTable table, String headerText, Color bg, Font font) {
        PdfPCell cell = new PdfPCell(new Paragraph(headerText, font));
        cell.setBackgroundColor(bg);
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cell);
    }

    private void addTableCell(PdfPTable table, String cellText, Color bg, Font font, Color borderColor) {
        PdfPCell cell = new PdfPCell(new Paragraph(cellText != null ? cellText : "", font));
        cell.setBackgroundColor(bg);
        cell.setPadding(6);
        cell.setBorderColor(borderColor);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cell);
    }
}
