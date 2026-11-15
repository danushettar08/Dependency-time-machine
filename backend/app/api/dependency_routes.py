
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.dependency_scanner import scan_dependencies
from app.services.version_checker import analyze_versions
from app.services.risk_analyzer import analyze_risks
from app.services.ai_explainer import explain_dependency_risks
from app.services.recommendation_engine import generate_recommendations
from app.services.vulnerability_checker import analyze_vulnerabilities


router = APIRouter(
    prefix="/api/dependencies",
    tags=["Dependency Scanner"]
)


# --------------------------------------------------
# FILE CONFIGURATION
# --------------------------------------------------

MAX_FILE_SIZE = 5 * 1024 * 1024

SUPPORTED_EXTENSIONS = {
    ".txt",
    ".json",
    ".toml",
    ".lock",
    ".mod"
}


# --------------------------------------------------
# VALIDATE AND READ UPLOADED FILE
# --------------------------------------------------

async def read_dependency_file(file: UploadFile):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is missing."
        )

    filename = file.filename.lower()
    extension = "." + filename.split(".")[-1]

    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format."
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size exceeds the 5 MB limit."
        )

    try:
        file_content = content.decode("utf-8-sig")

    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="File must contain readable UTF-8 text."
        )

    return file_content


# --------------------------------------------------
# RUN DEPENDENCY SCANNER
# --------------------------------------------------

def run_dependency_scan(file_content, filename):

    try:
        return scan_dependencies(
            file_content,
            filename
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Dependency scanning failed: {str(error)}"
        )


# --------------------------------------------------
# RUN VERSION ANALYSIS
# --------------------------------------------------

def run_version_analysis(dependencies):

    try:
        return analyze_versions(dependencies)

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Version analysis failed: {str(error)}"
        )


# --------------------------------------------------
# RUN RISK ANALYSIS
# --------------------------------------------------

def run_risk_analysis(version_result):

    try:
        return analyze_risks(version_result)

    except Exception as error:
        return {
            "status": "Risk analysis failed",
            "error": str(error),
            "total_analyzed": 0,
            "risk_summary": {
                "high": 0,
                "medium": 0,
                "low": 0,
                "unknown": 0
            },
            "results": []
        }


# --------------------------------------------------
# RUN VULNERABILITY ANALYSIS
# --------------------------------------------------

def run_vulnerability_analysis(version_result):

    packages = version_result.get(
        "packages",
        []
    )

    try:
        return analyze_vulnerabilities(packages)

    except Exception as error:
        return {
            "status": "Vulnerability analysis failed",
            "error": str(error),
            "total_packages": 0,
            "successfully_checked": 0,
            "failed_checks": 0,
            "total_vulnerabilities": 0,
            "severity_summary": {
                "Critical": 0,
                "High": 0,
                "Medium": 0,
                "Low": 0,
                "Unknown": 0
            },
            "vulnerabilities": [],
            "package_results": [],
            "unsupported_packages": []
        }


# --------------------------------------------------
# RUN RECOMMENDATION ENGINE
# --------------------------------------------------

def run_recommendations(risk_result):

    try:
        return generate_recommendations(
            risk_result
        )

    except Exception as error:
        return {
            "status": "Recommendation generation failed",
            "error": str(error),
            "total_recommendations": 0,
            "recommendations": []
        }


# --------------------------------------------------
# RUN AI EXPLANATION
# --------------------------------------------------

def run_ai_explanation(
    version_result,
    risk_result,
    recommendation_result,
    vulnerability_result
):

    try:

        analysis_data = {
            "version_analysis": version_result,
            "risk_analysis": risk_result,
            "recommendation_analysis": recommendation_result,
            "vulnerability_analysis": vulnerability_result
        }

        return explain_dependency_risks(
            analysis_data
        )

    except Exception as error:

        return {
            "status": "error",
            "message": str(error)
        }


# --------------------------------------------------
# 1. UPLOAD AND SCAN
# --------------------------------------------------

@router.post("/scan")
async def upload_and_scan(
    file: UploadFile = File(...)
):

    file_content = await read_dependency_file(file)

    dependency_analysis = run_dependency_scan(
        file_content,
        file.filename
    )

    return {
        "filename": file.filename,
        "status": "Dependency scanning completed",
        "dependency_analysis": dependency_analysis
    }


# --------------------------------------------------
# 2. CHECK DEPENDENCY VERSIONS
# --------------------------------------------------

@router.post("/check-versions")
async def check_dependency_versions(
    file: UploadFile = File(...)
):

    file_content = await read_dependency_file(file)

    dependency_analysis = run_dependency_scan(
        file_content,
        file.filename
    )

    dependencies = dependency_analysis.get(
        "dependencies",
        []
    )

    version_analysis = run_version_analysis(
        dependencies
    )

    return {
        "filename": file.filename,
        "status": "Dependency version analysis completed",
        "dependency_analysis": dependency_analysis,
        "version_analysis": version_analysis
    }


# --------------------------------------------------
# 3. COMPLETE DEPENDENCY RISK ANALYSIS
# --------------------------------------------------

@router.post("/analyze-risks")
async def analyze_dependency_risks(
    file: UploadFile = File(...)
):

    # STEP 1: Read uploaded file

    file_content = await read_dependency_file(file)


    # STEP 2: Scan dependencies

    dependency_analysis = run_dependency_scan(
        file_content,
        file.filename
    )

    dependencies = dependency_analysis.get(
        "dependencies",
        []
    )


    # STEP 3: Stop if no dependencies detected

    if not dependencies:

        return {
            "filename": file.filename,
            "status": "No dependencies detected",
            "dependency_analysis": dependency_analysis,
            "version_analysis": {
                "total_packages": 0,
                "packages": []
            },
            "risk_analysis": {
                "total_analyzed": 0,
                "risk_summary": {
                    "high": 0,
                    "medium": 0,
                    "low": 0,
                    "unknown": 0
                },
                "results": []
            },
            "recommendation_analysis": {
                "total_recommendations": 0,
                "recommendations": []
            },
            "vulnerability_analysis": {
                "total_packages": 0,
                "successfully_checked": 0,
                "failed_checks": 0,
                "total_vulnerabilities": 0,
                "severity_summary": {
                    "Critical": 0,
                    "High": 0,
                    "Medium": 0,
                    "Low": 0,
                    "Unknown": 0
                },
                "vulnerabilities": [],
                "package_results": [],
                "unsupported_packages": []
            },
            "ai_explanation": {
                "status": "skipped",
                "message": "No dependencies available for analysis."
            }
        }


    # STEP 4: Check latest versions

    version_analysis = run_version_analysis(
        dependencies
    )


    # STEP 5: Analyze upgrade risks

    risk_analysis = run_risk_analysis(
        version_analysis
    )


    # STEP 6: Check security vulnerabilities

    vulnerability_analysis = run_vulnerability_analysis(
        version_analysis
    )


    # STEP 7: Generate recommendations

    recommendation_analysis = run_recommendations(
        risk_analysis
    )


    # STEP 8: Generate AI explanation

    ai_explanation = run_ai_explanation(
        version_analysis,
        risk_analysis,
        recommendation_analysis,
        vulnerability_analysis
    )


    # STEP 9: Return complete analysis

    return {
        "filename": file.filename,
        "status": "Complete dependency analysis finished",
        "dependency_analysis": dependency_analysis,
        "version_analysis": version_analysis,
        "risk_analysis": risk_analysis,
        "recommendation_analysis": recommendation_analysis,
        "vulnerability_analysis": vulnerability_analysis,
        "ai_explanation": ai_explanation
    }
