
export const GameAssets = {
    // Player / NPC Parts
    SKELETON_TORSO: '/assets/PlayerSprite/torso.png',
    SKELETON_HEAD: '/assets/PlayerSprite/head.png',
    SKELETON_LEGS: '/assets/PlayerSprite/legs.png',
    SKELETON_FOOT: '/assets/PlayerSprite/foot.png',
    SKELETON_ARM: '/assets/PlayerSprite/arm.png',
    SKELETON_HAND: '/assets/PlayerSprite/hand.png',
    ENEMY_HEAD: '/assets/images/characters/enemy_head.png',

    // Weapons
    WEAPON_SWORD_1: '/assets/weapons/Sword1.png',

    // UI (Loaded via HTML usually, but can be preloaded)
    UI_SUN: '/assets/ui/sun.png',
    UI_CLOUD: '/assets/ui/cloud_atlas.png'
};

const images: Record<string, HTMLImageElement> = {};

export const loadAsset = (key: string, url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        if (images[key]) {
            resolve(images[key]);
            return;
        }

        const img = new Image();
        img.src = url;
        img.onload = () => {
            images[key] = img;
            resolve(img);
        };
        img.onerror = (e) => reject(e);
    });
};

export const getAsset = (key: string): HTMLImageElement | undefined => {
    return images[key];
};

export const preloadGameAssets = async () => {
    const promises = Object.entries(GameAssets).map(([key, url]) => loadAsset(key, url));
    await Promise.all(promises);
    console.log("All game assets preloaded.");
};
