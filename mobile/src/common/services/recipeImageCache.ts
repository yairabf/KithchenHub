import * as FileSystem from 'expo-file-system';

export type RecipeImageVariant = 'image' | 'thumb';

type CachedImageParams = {
  recipeId: string;
  variant: RecipeImageVariant;
  imageVersion?: number | null;
  remoteUrl?: string | null;
};

const CACHE_ROOT = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}recipe-images`
  : null;

const ensureDirExists = async (dirPath: string): Promise<void> => {
  const info = await FileSystem.getInfoAsync(dirPath);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
  }
};

const buildFileName = (variant: RecipeImageVariant, imageVersion: number) =>
  `${variant}_v${imageVersion}.webp`;

const buildRecipeDir = (recipeId: string) =>
  CACHE_ROOT ? `${CACHE_ROOT}/${recipeId}` : null;

export const getCachedImageUri = async ({
  recipeId,
  variant,
  imageVersion,
  remoteUrl,
}: CachedImageParams): Promise<string | null> => {
  if (!remoteUrl) return null;
  if (!CACHE_ROOT || !imageVersion || imageVersion <= 0) return remoteUrl;

  const recipeDir = buildRecipeDir(recipeId);
  if (!recipeDir) return remoteUrl;

  await ensureDirExists(recipeDir);
  const localPath = `${recipeDir}/${buildFileName(variant, imageVersion)}`;
  const localInfo = await FileSystem.getInfoAsync(localPath);
  if (localInfo.exists) {
    return localPath;
  }

  try {
    const downloaded = await FileSystem.downloadAsync(remoteUrl, localPath);
    return downloaded.uri || remoteUrl;
  } catch (error) {
    console.warn('[recipeImageCache] Failed to cache image:', error);
    return remoteUrl;
  }
};

export const pruneStaleImages = async (
  recipes: { id: string; imageVersion?: number | null }[],
): Promise<void> => {
  if (!CACHE_ROOT) return;

  const rootInfo = await FileSystem.getInfoAsync(CACHE_ROOT);
  if (!rootInfo.exists) return;

  const allowedByRecipe = new Map<string, Set<string>>();
  for (const recipe of recipes) {
    if (!recipe.imageVersion || recipe.imageVersion <= 0) continue;
    const recipeDir = buildRecipeDir(recipe.id);
    if (!recipeDir) continue;
    const imageFile = buildFileName('image', recipe.imageVersion);
    const thumbFile = buildFileName('thumb', recipe.imageVersion);
    allowedByRecipe.set(recipe.id, new Set([imageFile, thumbFile]));
  }

  try {
    const recipeDirs = await FileSystem.readDirectoryAsync(CACHE_ROOT);
    await Promise.all(
      recipeDirs.map(async (dirName) => {
        const recipeDir = buildRecipeDir(dirName);
        if (!recipeDir) return;
        const allowedFiles = allowedByRecipe.get(dirName);
        if (!allowedFiles) {
          await FileSystem.deleteAsync(recipeDir, { idempotent: true });
          return;
        }
        const files = await FileSystem.readDirectoryAsync(recipeDir);
        await Promise.all(
          files.map(async (fileName) => {
            if (allowedFiles.has(fileName)) {
              return;
            }
            await FileSystem.deleteAsync(`${recipeDir}/${fileName}`, {
              idempotent: true,
            });
          }),
        );
      }),
    );
  } catch (error) {
    console.warn('[recipeImageCache] Failed to prune stale images:', error);
  }
};
