import json
import re
import tomllib

from packaging.requirements import Requirement, InvalidRequirement


def make_dependency(name, version, ecosystem, dependency_type="direct"):
    return {
        "name": name,
        "version": version or "Not specified",
        "extras": [],
        "ecosystem": ecosystem,
        "dependency_type": dependency_type
    }


def scan_requirements(content):
    dependencies = []
    errors = []

    for line_number, line in enumerate(content.splitlines(), start=1):
        line = line.strip()

        if not line or line.startswith("#"):
            continue

        try:
            requirement = Requirement(line)

            dependencies.append(
                make_dependency(
                    requirement.name,
                    str(requirement.specifier),
                    "PyPI"
                )
            )

        except InvalidRequirement:
            errors.append({
                "line": line_number,
                "content": line,
                "error": "Invalid Python requirement"
            })

    return dependencies, errors


def scan_package_json(data):
    dependencies = []

    sections = [
        ("dependencies", "direct"),
        ("devDependencies", "development"),
        ("optionalDependencies", "optional"),
        ("peerDependencies", "peer")
    ]

    for section, dependency_type in sections:
        packages = data.get(section, {})

        if not isinstance(packages, dict):
            continue

        for name, version in packages.items():
            dependencies.append(
                make_dependency(
                    name,
                    str(version),
                    "npm",
                    dependency_type
                )
            )

    return dependencies, []


def scan_package_lock(data):
    dependencies = []

    packages = data.get("packages", {})

    if packages:
        for path, details in packages.items():
            if not path.startswith("node_modules/"):
                continue

            name = path.split("node_modules/")[-1]

            dependencies.append(
                make_dependency(
                    name,
                    details.get("version"),
                    "npm",
                    "transitive"
                )
            )

    else:
        def extract_legacy(items):
            for name, details in items.items():
                dependencies.append(
                    make_dependency(
                        name,
                        details.get("version"),
                        "npm",
                        "transitive"
                    )
                )

                extract_legacy(details.get("dependencies", {}))

        extract_legacy(data.get("dependencies", {}))

    return dependencies, []


def scan_pyproject(data):
    dependencies = []

    project = data.get("project", {})

    for item in project.get("dependencies", []):
        try:
            requirement = Requirement(item)

            dependencies.append(
                make_dependency(
                    requirement.name,
                    str(requirement.specifier),
                    "PyPI"
                )
            )
        except InvalidRequirement:
            continue

    optional = project.get("optional-dependencies", {})

    for group, packages in optional.items():
        for item in packages:
            try:
                requirement = Requirement(item)

                dependencies.append(
                    make_dependency(
                        requirement.name,
                        str(requirement.specifier),
                        "PyPI",
                        "optional"
                    )
                )
            except InvalidRequirement:
                continue

    poetry = data.get("tool", {}).get("poetry", {})

    for section in ["dependencies", "dev-dependencies"]:
        for name, details in poetry.get(section, {}).items():

            if name.lower() == "python":
                continue

            if isinstance(details, dict):
                version = details.get("version", "Not specified")
            else:
                version = str(details)

            dependencies.append(
                make_dependency(
                    name,
                    version,
                    "PyPI",
                    "development" if section == "dev-dependencies" else "direct"
                )
            )

    return dependencies, []


def scan_pipfile(data):
    dependencies = []

    for section, dependency_type in [
        ("packages", "direct"),
        ("dev-packages", "development")
    ]:
        for name, details in data.get(section, {}).items():

            if isinstance(details, dict):
                version = details.get("version", "Not specified")
            else:
                version = str(details)

            dependencies.append(
                make_dependency(
                    name,
                    version,
                    "PyPI",
                    dependency_type
                )
            )

    return dependencies, []


def scan_go_mod(content):
    dependencies = []
    inside_block = False

    for line in content.splitlines():
        line = line.strip()

        if not line or line.startswith("//"):
            continue

        if line.startswith("require ("):
            inside_block = True
            continue

        if inside_block and line == ")":
            inside_block = False
            continue

        if line.startswith("require "):
            line = line[len("require "):]

        if inside_block or line:
            parts = line.split()

            if len(parts) >= 2 and parts[1].startswith("v"):
                if parts[0] not in ("module", "go", "toolchain", "replace"):
                    dependencies.append(
                        make_dependency(
                            parts[0],
                            parts[1],
                            "Go"
                        )
                    )

    return dependencies, []


def scan_dependencies(file_content, filename="requirements.txt"):

    filename = filename.lower().split("/")[-1].split("\\")[-1]

    errors = []
    dependencies = []

    try:

        if filename in ("requirements.txt", "pip-requirements.txt") or filename.endswith(".txt"):
            dependencies, errors = scan_requirements(file_content)

        elif filename == "package.json":
            data = json.loads(file_content)
            dependencies, errors = scan_package_json(data)

        elif filename == "package-lock.json":
            data = json.loads(file_content)
            dependencies, errors = scan_package_lock(data)

        elif filename == "pyproject.toml":
            data = tomllib.loads(file_content)
            dependencies, errors = scan_pyproject(data)

        elif filename == "pipfile":
            data = tomllib.loads(file_content)
            dependencies, errors = scan_pipfile(data)

        elif filename == "go.mod":
            dependencies, errors = scan_go_mod(file_content)

        else:
            raise ValueError(
                f"Unsupported file format: {filename}"
            )

    except (json.JSONDecodeError, tomllib.TOMLDecodeError) as error:
        raise ValueError(f"Could not parse {filename}: {error}")

    # Remove duplicate package entries while preserving order.
    unique = {}

    for dependency in dependencies:
        key = (
            dependency["ecosystem"],
            dependency["name"].lower()
        )

        if key not in unique:
            unique[key] = dependency

    dependencies = list(unique.values())

    return {
        "filename": filename,
        "total_dependencies": len(dependencies),
        "ecosystems": list(set(
            item["ecosystem"] for item in dependencies
        )),
        "dependencies": dependencies,
        "errors": errors
    }