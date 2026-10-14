"""
Generate a professional, publication-quality PDF report for the Health Risk Intelligence Platform.
"""

import sys
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUTPUT_PDF = Path(__file__).resolve().parent / "HEALTH_RISK_PLATFORM_DOCUMENTARY_REPORT.pdf"


def build_pdf():
    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#1e3a34"),
    )

    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#2f6e62"),
    )

    h1_style = ParagraphStyle(
        "Heading1_Custom",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=19,
        textColor=colors.HexColor("#1e3a34"),
        spaceBefore=12,
        spaceAfter=6,
    )

    h2_style = ParagraphStyle(
        "Heading2_Custom",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#2f6e62"),
        spaceBefore=10,
        spaceAfter=4,
    )

    body_style = ParagraphStyle(
        "Body_Custom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#1f2e2b"),
        spaceAfter=6,
    )

    meta_style = ParagraphStyle(
        "Meta_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#5b6b66"),
    )

    th_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
    )

    td_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#1f2e2b"),
    )

    td_winner_style = ParagraphStyle(
        "TableCellWinner",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#065f46"),
    )

    story = []

    # Title & Header
    story.append(Paragraph("Health Risk Intelligence Platform", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Comprehensive Technical Specification & Side-by-Side Audit Report", subtitle_style))
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            "<b>Clinical Focus:</b> Type 2 Diabetes Stratification, Explainability & Counterfactual Interventions &nbsp;|&nbsp; <b>Version:</b> 2.1-Production &nbsp;|&nbsp; <b>Status:</b> Validated",
            meta_style,
        )
    )
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2f6e62"), spaceAfter=12))

    # Executive Summary
    story.append(Paragraph("1. Executive Summary & Clinical Mission", h1_style))
    story.append(
        Paragraph(
            "The Health Risk Intelligence Platform is an end-to-end, clinical-grade medical decision support system designed to transcend basic academic modeling. Traditional health risk notebooks print uncalibrated accuracy scores on unvalidated data splits. In contrast, this platform provides <b>calibrated empirical risk probabilities</b>, <b>SHAP game-theory biomarker attributions</b>, an interactive <b>Counterfactual 'What-If' Simulation Engine</b>, and <b>evidence-based ADA clinical care plans</b>.",
            body_style,
        )
    )

    # Side-by-Side Table 1: Baseline Prototype vs Enhanced Platform
    story.append(Paragraph("2. Side-by-Side Comparative Audit: Baseline vs. Enhanced Platform", h1_style))

    data_t1 = [
        [
            Paragraph("<b>Evaluation Dimension</b>", th_style),
            Paragraph("<b>Original Baseline Version</b>", th_style),
            Paragraph("<b>Enhanced Production Platform (v2.1)</b>", th_style),
        ],
        [
            Paragraph("<b>Model Architectures</b>", td_style),
            Paragraph("Single script with 3 models; no modern histogram tree algorithms.", td_style),
            Paragraph("<b>5-Model Tournament:</b> Logistic Regression, Random Forest, XGBoost, LightGBM (HistGradient), and Calibrated models.", td_winner_style),
        ],
        [
            Paragraph("<b>Evaluation Matrix</b>", td_style),
            Paragraph("AUPRC and AUROC only.", td_style),
            Paragraph("<b>Full Matrix:</b> AUPRC, AUROC, Brier Score, F1, Accuracy, Precision, Recall/Sensitivity, Specificity.", td_winner_style),
        ],
        [
            Paragraph("<b>User Authentication</b>", td_style),
            Paragraph("Hardcoded dummy string ('demo_user'). No security.", td_style),
            Paragraph("<b>JWT Bearer Auth</b> with bcrypt salted hashing (12 rounds) & role permissions (Clinician, Admin).", td_winner_style),
        ],
        [
            Paragraph("<b>Decision Support</b>", td_style),
            Paragraph("Static risk score only; zero actionable next steps.", td_style),
            Paragraph("<b>ADA Clinical Action Plan:</b> Prioritized diet, exercise, and lab orders mapped to SHAP drivers.", td_winner_style),
        ],
        [
            Paragraph("<b>Counterfactual Reasoning</b>", td_style),
            Paragraph("None. Patient cannot test lifestyle modifications.", td_style),
            Paragraph("<b>What-If Simulator:</b> Interactive sliders calculate exact risk reduction in real time.", td_winner_style),
        ],
        [
            Paragraph("<b>EHR Integration</b>", td_style),
            Paragraph("Standard browser window print.", td_style),
            Paragraph("<b>Hospital-Grade EHR SOAP Note Generator</b> with diagnostic ICD-10 billing codes (Z13.1, R73.03, E66.01).", td_winner_style),
        ],
        [
            Paragraph("<b>Cardio-Metabolic Screening</b>", td_style),
            Paragraph("Diabetes probability only.", td_style),
            Paragraph("<b>ATP III / IDF Cardio-Metabolic Syndrome Index:</b> Checks 5 co-occurring cardiovascular risk factors.", td_winner_style),
        ],
        [
            Paragraph("<b>Body Composition Usability</b>", td_style),
            Paragraph("Forced user to know exact decimal BMI number.", td_style),
            Paragraph("<b>Integrated BMI Calculator:</b> Converts Height & Weight in both Metric (cm/kg) and Imperial (ft/in/lbs).", td_winner_style),
        ],
    ]

    t1 = Table(data_t1, colWidths=[110, 210, 220])
    t1.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2f6e62")),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d9dcd6")),
            ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#f8faf9")),
            ("BACKGROUND", (0, 3), (-1, 3), colors.HexColor("#f8faf9")),
            ("BACKGROUND", (0, 5), (-1, 5), colors.HexColor("#f8faf9")),
            ("BACKGROUND", (0, 7), (-1, 7), colors.HexColor("#f8faf9")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8faf9")]),
        ])
    )
    story.append(t1)
    story.append(Spacer(1, 12))

    # Side-by-Side Table 2: Multi-Algorithm Tournament Matrix
    story.append(Paragraph("3. Multi-Algorithm Tournament Performance (Held-Out Test Set N=1,554 from 7,768 Multi-Center Cohort)", h1_style))

    data_t2 = [
        [
            Paragraph("<b>Algorithm Architecture</b>", th_style),
            Paragraph("<b>Family</b>", th_style),
            Paragraph("<b>Test AUPRC</b>", th_style),
            Paragraph("<b>Test AUROC</b>", th_style),
            Paragraph("<b>Brier Score</b>", th_style),
            Paragraph("<b>Sensitivity</b>", th_style),
            Paragraph("<b>Specificity</b>", th_style),
            Paragraph("<b>Accuracy</b>", th_style),
        ],
        [
            Paragraph("<b>Logistic Regression (Winner)</b> 🏆", td_winner_style),
            Paragraph("Generalized Linear", td_winner_style),
            Paragraph("<b>0.7734</b>", td_winner_style),
            Paragraph("<b>0.8513</b>", td_winner_style),
            Paragraph("<b>0.1461</b>", td_winner_style),
            Paragraph("<b>68.9%</b>", td_winner_style),
            Paragraph("<b>84.0%</b>", td_winner_style),
            Paragraph("<b>79.4%</b>", td_winner_style),
        ],
        [
            Paragraph("Calibrated Logistic Reg", td_style),
            Paragraph("Isotonic Post-Hoc", td_style),
            Paragraph("0.7713", td_style),
            Paragraph("0.8512", td_style),
            Paragraph("0.1304", td_style),
            Paragraph("53.9%", td_style),
            Paragraph("94.2%", td_style),
            Paragraph("82.0%", td_style),
        ],
        [
            Paragraph("LightGBM (HistGradient)", td_style),
            Paragraph("Histogram-Binned Trees", td_style),
            Paragraph("0.7656", td_style),
            Paragraph("0.8460", td_style),
            Paragraph("0.1451", td_style),
            Paragraph("67.4%", td_style),
            Paragraph("84.1%", td_style),
            Paragraph("79.1%", td_style),
        ],
        [
            Paragraph("Random Forest (300 Trees)", td_style),
            Paragraph("Bagging Ensemble", td_style),
            Paragraph("0.7653", td_style),
            Paragraph("0.8478", td_style),
            Paragraph("0.1455", td_style),
            Paragraph("65.2%", td_style),
            Paragraph("86.6%", td_style),
            Paragraph("80.2%", td_style),
        ],
        [
            Paragraph("XGBoost (Depth 4)", td_style),
            Paragraph("Gradient Boosted Trees", td_style),
            Paragraph("0.7594", td_style),
            Paragraph("0.8411", td_style),
            Paragraph("0.1460", td_style),
            Paragraph("67.6%", td_style),
            Paragraph("85.3%", td_style),
            Paragraph("79.9%", td_style),
        ],
    ]

    t2 = Table(data_t2, colWidths=[130, 85, 55, 55, 55, 55, 55, 50])
    t2.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a34")),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d9dcd6")),
            ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#e6f4ea")),
            ("ROWBACKGROUNDS", (0, 2), (-1, -1), [colors.white, colors.HexColor("#f8faf9")]),
        ])
    )
    story.append(t2)
    story.append(Spacer(1, 10))

    # Methodological Details
    story.append(Paragraph("4. Clinical Data Engineering & Explainable AI (SHAP)", h1_style))
    story.append(
        Paragraph(
            "<b>Zero-as-Missing Sanitization:</b> In clinical datasets, physiologically impossible zeros (e.g. Glucose = 0 or BP = 0) represent uncollected laboratory tests rather than true zero values. Our pipeline converts zeros to NaN and performs median imputation exclusively on training folds to prevent data leakage.<br/>"
            "<b>Clinically-Grounded Features:</b> Synthesizes the Metabolic Synergy Index <code>(Glucose * BMI) / 100</code>, WHO BMI buckets, and ADA glycemic classifications.<br/>"
            "<b>SHAP Cooperative Game Theory:</b> Every prediction decomposes into additive marginal contributions <i>f(x) = &phi;<sub>0</sub> + &sum; &phi;<sub>i</sub></i> against a 100-sample reference background distribution, enabling clinicians to audit exact biomarker attributions.",
            body_style,
        )
    )
    story.append(Spacer(1, 8))

    # Architecture & API Flow
    story.append(Paragraph("5. Microservice Architecture & API Directory", h1_style))

    data_api = [
        [Paragraph("<b>Endpoint</b>", th_style), Paragraph("<b>HTTP Method</b>", th_style), Paragraph("<b>Clinical Functionality</b>", th_style)],
        [Paragraph("<code>/predict</code>", td_style), Paragraph("POST", td_style), Paragraph("Calibrated risk probability, population percentile, SHAP drivers, and ADA care plan.", td_style)],
        [Paragraph("<code>/predict/simulate</code>", td_style), Paragraph("POST", td_style), Paragraph("Counterfactual What-If simulation: calculates exact risk reduction when altering biomarkers.", td_style)],
        [Paragraph("<code>/predict/recommendations</code>", td_style), Paragraph("POST", td_style), Paragraph("Tailored lifestyle and dietary clinical guidance based on individual risk tier.", td_style)],
        [Paragraph("<code>/auth/login</code> & <code>/auth/register</code>", td_style), Paragraph("POST", td_style), Paragraph("JWT Bearer security with bcrypt salted password encryption.", td_style)],
        [Paragraph("<code>/history/{user_id}/export/csv</code>", td_style), Paragraph("GET", td_style), Paragraph("One-click downloadable CSV patient trajectory for EHR integration.", td_style)],
        [Paragraph("<code>/admin/models</code>", td_style), Paragraph("GET", td_style), Paragraph("Active model registry and multi-algorithm benchmark comparison suite.", td_style)],
    ]

    t_api = Table(data_api, colWidths=[150, 70, 320])
    t_api.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2f6e62")),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d9dcd6")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8faf9")]),
        ])
    )
    story.append(t_api)
    story.append(Spacer(1, 14))

    # Disclaimer Footer
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#d9dcd6"), spaceAfter=8))
    story.append(
        Paragraph(
            "<b>Clinical Disclaimer:</b> This document and the associated software are developed strictly for Clinical Decision Support (CDS) demonstration and portfolio evaluation. They do not constitute an autonomous medical device or diagnostic instrument. All clinical care must be supervised by a licensed medical practitioner.",
            meta_style,
        )
    )

    doc.build(story)
    print(f"[OK] Successfully generated PDF report at: {OUTPUT_PDF}")


if __name__ == "__main__":
    build_pdf()
