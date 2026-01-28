import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Controller metadata audit test.
 *
 * This test ensures that all controllers have version metadata in their @Controller() decorator.
 * This is critical to prevent accidental unversioned routes that bypass versioning.
 *
 * Exception allowlist: Meta endpoints like VersionController for /api/version can be unversioned.
 */
describe('Controller Metadata Audit', () => {
  const ALLOWLISTED_CONTROLLERS = [
    'VersionController', // /api/version is intentionally unversioned
  ];

  /**
   * Recursively finds all TypeScript files in a directory
   */
  function findTypeScriptFiles(dir: string, fileList: string[] = []): string[] {
    try {
      const files = fs.readdirSync(dir);

      files.forEach((file) => {
        const filePath = path.join(dir, file);
        try {
          const stat = fs.statSync(filePath);

          if (stat.isDirectory()) {
            // Skip node_modules and dist directories
            if (!['node_modules', 'dist', '.git'].includes(file)) {
              findTypeScriptFiles(filePath, fileList);
            }
          } else if (
            file.endsWith('.controller.ts') &&
            !file.endsWith('.spec.ts')
          ) {
            fileList.push(filePath);
          }
        } catch (error) {
          // Skip files/directories that can't be accessed (permissions, etc.)
          console.warn(`Could not access ${filePath}:`, error);
        }
      });
    } catch (error) {
      // Log error but don't fail test - might be intentional (e.g., in CI)
      console.warn(`Could not read directory ${dir}:`, error);
    }

    return fileList;
  }

  /**
   * Extracts controller class name and decorator metadata from a file
   */
  function extractControllerMetadata(filePath: string): {
    className: string;
    hasVersion: boolean;
    path?: string;
    version?: string;
  } | null {
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.warn(`Could not read file ${filePath}:`, error);
      return null;
    }

    // Extract class name
    const classMatch = content.match(/export\s+class\s+(\w+Controller)/);
    if (!classMatch) {
      return null;
    }

    const className = classMatch[1];

    // Check if controller is allowlisted
    if (ALLOWLISTED_CONTROLLERS.includes(className)) {
      return {
        className,
        hasVersion: true, // Allowlisted controllers are considered valid
      };
    }

    // Check for @Controller({ path: '...', version: '...' }) pattern
    const controllerObjectMatch = content.match(
      /@Controller\s*\(\s*\{\s*path:\s*['"]([^'"]+)['"],\s*version:\s*['"](\d+)['"]\s*\}/,
    );

    if (controllerObjectMatch) {
      return {
        className,
        hasVersion: true,
        path: controllerObjectMatch[1],
        version: controllerObjectMatch[2],
      };
    }

    // Check for @Controller('path') without version (invalid)
    const controllerStringMatch = content.match(
      /@Controller\s*\(\s*['"]([^'"]+)['"]\s*\)/,
    );
    if (controllerStringMatch) {
      return {
        className,
        hasVersion: false,
        path: controllerStringMatch[1],
      };
    }

    // No @Controller decorator found (shouldn't happen, but handle gracefully)
    return {
      className,
      hasVersion: false,
    };
  }

  it('should have version metadata in all controllers', () => {
    const srcPath = path.join(__dirname, '../../');
    const controllerFiles = findTypeScriptFiles(srcPath);

    const violations: Array<{
      file: string;
      className: string;
      path?: string;
    }> = [];

    controllerFiles.forEach((filePath) => {
      const metadata = extractControllerMetadata(filePath);
      if (metadata && !metadata.hasVersion) {
        violations.push({
          file: path.relative(srcPath, filePath),
          className: metadata.className,
          path: metadata.path,
        });
      }
    });

    if (violations.length > 0) {
      const violationMessages = violations.map(
        (v) =>
          `  - ${v.className} in ${v.file}${v.path ? ` (path: ${v.path})` : ''}`,
      );

      fail(
        `Found ${violations.length} controller(s) without version metadata:\n${violationMessages.join('\n')}\n\n` +
          'All controllers must use @Controller({ path: "...", version: "1" }) format.\n' +
          `Exception: ${ALLOWLISTED_CONTROLLERS.join(', ')} can be unversioned.`,
      );
    }

    // If we get here, all controllers have version metadata
    expect(violations.length).toBe(0);
  });

  it('should have valid version numbers in controller metadata', () => {
    const srcPath = path.join(__dirname, '../../');
    const controllerFiles = findTypeScriptFiles(srcPath);

    const invalidVersions: Array<{
      file: string;
      className: string;
      version: string;
    }> = [];

    controllerFiles.forEach((filePath) => {
      const metadata = extractControllerMetadata(filePath);
      if (metadata && metadata.hasVersion && metadata.version) {
        // Version should be a positive integer
        const versionNum = parseInt(metadata.version, 10);
        if (isNaN(versionNum) || versionNum < 1) {
          invalidVersions.push({
            file: path.relative(srcPath, filePath),
            className: metadata.className,
            version: metadata.version,
          });
        }
      }
    });

    if (invalidVersions.length > 0) {
      const violationMessages = invalidVersions.map(
        (v) => `  - ${v.className} in ${v.file} (version: ${v.version})`,
      );

      fail(
        `Found ${invalidVersions.length} controller(s) with invalid version numbers:\n${violationMessages.join('\n')}\n\n` +
          'Version must be a positive integer (e.g., "1", "2", "3").',
      );
    }

    expect(invalidVersions.length).toBe(0);
  });
});
