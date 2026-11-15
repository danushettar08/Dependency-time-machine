from packaging.version import Version, InvalidVersion


def analyze_risks(version_analysis):
    """
    Estimate upgrade compatibility risk based on
    version differences.

    IMPORTANT:
    This is an upgrade compatibility estimate.
    It is NOT a confirmed security vulnerability scan.
    """

    risk_results = []

    for package in version_analysis.get("packages", []):

        name = package.get(
            "name",
            package.get("package", "Unknown")
        )

        current = package.get("current_version")

        latest = package.get("latest_version")

        status = package.get("update_status", "Unknown")

        risk_level = "Unknown"

        reason = "Insufficient version information."

        recommendation = "Review package information manually."

        if not current or not latest:

            risk_results.append({

                "name": name,
                "package": name,

                "current_version": current,

                "latest_version": latest,

                "risk_level": risk_level,

                "reason": reason,

                "recommendation": recommendation

            })

            continue

        try:

            old_version = Version(current)

            new_version = Version(latest)

            old_parts = old_version.release

            new_parts = new_version.release

            old_major = old_parts[0]

            new_major = new_parts[0]

            old_minor = (
                old_parts[1]
                if len(old_parts) > 1
                else 0
            )

            new_minor = (
                new_parts[1]
                if len(new_parts) > 1
                else 0
            )

            if status == "Up to Date":

                risk_level = "Low"

                reason = (
                    "The specified version matches "
                    "the latest version."
                )

                recommendation = (
                    "No version upgrade is currently needed."
                )

            elif status != "Update Available":

                risk_level = "Unknown"

                reason = (
                    "The version comparison needs further review."
                )

                recommendation = (
                    "Check package version information."
                )

            elif old_major != new_major:

                risk_level = "High"

                reason = (
                    "A major version boundary is crossed."
                )

                recommendation = (
                    "Review breaking changes and run "
                    "compatibility tests before upgrading."
                )

            elif old_major == 0 and old_minor != new_minor:

                risk_level = "High"

                reason = (
                    "A minor version change in a pre-1.0 "
                    "package may introduce breaking changes."
                )

                recommendation = (
                    "Review release notes and test carefully."
                )

            elif old_minor != new_minor:

                risk_level = "Medium"

                reason = (
                    "The minor version has changed."
                )

                recommendation = (
                    "Review release notes and run tests."
                )

            else:

                risk_level = "Low"

                reason = (
                    "Only the patch-level version has changed."
                )

                recommendation = (
                    "Run tests before applying the update."
                )

        except InvalidVersion:

            risk_level = "Unknown"

            reason = (
                "Version format could not be interpreted."
            )

            recommendation = (
                "Verify the package version manually."
            )

        risk_results.append({

            # Both keys are intentionally provided.
            "name": name,
            "package": name,

            "current_version": current,

            "latest_version": latest,

            "risk_level": risk_level,

            "reason": reason,

            "recommendation": recommendation

        })

    return {

        "total_analyzed": len(risk_results),

        "risk_summary": {

            "high": sum(
                item["risk_level"] == "High"
                for item in risk_results
            ),

            "medium": sum(
                item["risk_level"] == "Medium"
                for item in risk_results
            ),

            "low": sum(
                item["risk_level"] == "Low"
                for item in risk_results
            ),

            "unknown": sum(
                item["risk_level"] == "Unknown"
                for item in risk_results
            )

        },

        "results": risk_results

    }