import re
import requests

from urllib.parse import quote
from packaging.version import Version, InvalidVersion
from packaging.specifiers import SpecifierSet


# --------------------------------------------------
# HTTP REQUEST
# --------------------------------------------------

def get_registry_data(url):

    try:
        response = requests.get(
            url,
            timeout=10,
            headers={
                "User-Agent": "Dependency-Time-Machine/1.0"
            }
        )

        if response.status_code == 404:
            return None

        response.raise_for_status()

        return response.json()

    except requests.RequestException:
        return None

    except ValueError:
        return None


# --------------------------------------------------
# PYTHON: PYPI
# --------------------------------------------------

def get_pypi_latest(package_name):

    url = (
        f"https://pypi.org/pypi/"
        f"{quote(package_name, safe='')}/json"
    )

    data = get_registry_data(url)

    if not data:
        return None

    return data.get("info", {}).get("version")


# --------------------------------------------------
# JAVASCRIPT: NPM
# --------------------------------------------------

def get_npm_latest(package_name):

    encoded_name = quote(package_name, safe="@")

    url = (
        f"https://registry.npmjs.org/"
        f"{encoded_name}/latest"
    )

    data = get_registry_data(url)

    if not data:
        return None

    return data.get("version")


# --------------------------------------------------
# GO MODULE PROXY
# --------------------------------------------------

def escape_go_module_name(module_name):

    result = ""

    for character in module_name:

        if character.isupper():
            result += "!" + character.lower()

        else:
            result += character

    return result


def get_go_latest(package_name):

    escaped_name = escape_go_module_name(package_name)

    url = (
        f"https://proxy.golang.org/"
        f"{escaped_name}/@latest"
    )

    data = get_registry_data(url)

    if not data:
        return None

    return data.get("Version")


# --------------------------------------------------
# GET LATEST VERSION BY ECOSYSTEM
# --------------------------------------------------

def get_latest_version(package_name, ecosystem):

    ecosystem = (ecosystem or "").lower()

    if ecosystem == "pypi":
        return get_pypi_latest(package_name)

    elif ecosystem == "npm":
        return get_npm_latest(package_name)

    elif ecosystem == "go":
        return get_go_latest(package_name)

    return None


# --------------------------------------------------
# EXTRACT CURRENT VERSION
# --------------------------------------------------

def extract_current_version(dependency):

    required_version = str(
        dependency.get("version", "")
    ).strip()

    ecosystem = (
        dependency.get("ecosystem", "")
        .lower()
    )

    dependency_type = dependency.get(
        "dependency_type",
        "direct"
    )

    if not required_version:
        return None

    # Python exact version:
    # Example: ==2.31.0

    if ecosystem == "pypi":

        try:
            specifiers = list(
                SpecifierSet(required_version)
            )

            if (
                len(specifiers) == 1
                and specifiers[0].operator == "=="
                and "*" not in specifiers[0].version
            ):

                return specifiers[0].version

        except Exception:
            return None

        return None

    # npm lockfiles contain installed versions.
    # package.json may contain ranges such as ^1.2.0.

    if ecosystem == "npm":

        if dependency_type == "transitive":

            return required_version.lstrip("v")

        if re.fullmatch(
            r"v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?",
            required_version
        ):

            return required_version.lstrip("v")

        return None

    # Go modules generally use exact versions.

    if ecosystem == "go":

        if re.fullmatch(
            r"v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?",
            required_version
        ):

            return required_version

        return None

    return None


# --------------------------------------------------
# COMPARE VERSIONS
# --------------------------------------------------

def compare_versions(current_version, latest_version):

    if not current_version:
        return "Current Version Unknown"

    if not latest_version:
        return "Package Information Unavailable"

    try:

        current = Version(current_version)

        latest = Version(latest_version)

        if latest > current:
            return "Update Available"

        elif latest == current:
            return "Up to Date"

        else:
            return "Check Compatibility"

    except InvalidVersion:
        return "Version Comparison Failed"


# --------------------------------------------------
# MAIN VERSION ANALYSIS
# --------------------------------------------------

def analyze_versions(dependencies):

    results = []

    for dependency in dependencies:

        package_name = dependency["name"]

        ecosystem = dependency.get(
            "ecosystem",
            "PyPI"
        )

        required_version = dependency.get(
            "version",
            "Not specified"
        )

        current_version = extract_current_version(
            dependency
        )

        latest_version = get_latest_version(
            package_name,
            ecosystem
        )

        update_status = compare_versions(
            current_version,
            latest_version
        )

        results.append({

            "package": package_name,

            "ecosystem": ecosystem,

            "dependency_type": dependency.get(
                "dependency_type",
                "direct"
            ),

            "current_version": current_version,

            "required_version": required_version,

            "latest_version": latest_version,

            "update_status": update_status

        })

    return {

        "total_packages": len(results),

        "packages": results

    }