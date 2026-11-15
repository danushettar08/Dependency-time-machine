def generate_recommendations(risk_analysis):

    recommendations = []

    priority_scores = {
        "High": 90,
        "Medium": 60,
        "Low": 30,
        "Unknown": 10
    }

    for package in risk_analysis["results"]:

        name = package.get("package", "Unknown")

        current = package.get("current_version")

        latest = package.get("latest_version")

        risk = package.get("risk_level", "Unknown")

        score = 0
        priority = "Unknown"
        action = ""
        reason = ""

        # Latest version unavailable
        if not latest:

            score = 0
            priority = "Unavailable"

            action = "Check package information manually."

            reason = "Latest version information is unavailable."

        # Current version unavailable
        elif not current:

            score = 20
            priority = "Low"

            action = "Identify the currently installed version first."

            reason = "Current version information is missing."

        # Already up to date
        elif current == latest:

            score = 0
            priority = "No Action Needed"

            action = "Keep the current version."

            reason = "The current version matches the latest version."

        # High risk
        elif risk == "High":

            score = priority_scores["High"]
            priority = "High"

            action = (
                "Investigate breaking changes, check compatibility, "
                "and perform thorough testing before upgrading."
            )

            reason = (
                "A potentially breaking version change was detected. "
                "This dependency needs careful attention."
            )

        # Medium risk
        elif risk == "Medium":

            score = priority_scores["Medium"]
            priority = "Medium"

            action = (
                "Review release notes and perform compatibility tests "
                "before upgrading."
            )

            reason = "The version change requires compatibility review."

        # Low risk
        elif risk == "Low":

            score = priority_scores["Low"]
            priority = "Low"

            action = (
                "Consider upgrading after performing basic tests."
            )

            reason = "The estimated upgrade risk is low."

        # Unknown risk
        else:

            score = priority_scores["Unknown"]
            priority = "Unknown"

            action = "Manually investigate package compatibility."

            reason = "Insufficient information to estimate upgrade risk."

        recommendations.append({

            "package": name,

            "current_version": current,

            "latest_version": latest,

            "risk_level": risk,

            "priority_score": score,

            "priority": priority,

            "recommended_action": action,

            "reason": reason

        })

    recommendations.sort(
        key=lambda item: item["priority_score"],
        reverse=True
    )

    return {

        "total_recommendations": len(recommendations),

        "recommendations": recommendations

    }