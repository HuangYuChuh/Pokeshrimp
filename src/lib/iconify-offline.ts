/**
 * Pre-load icon sets from local packages so Iconify never hits CDN.
 * Import this file once at app root (layout.tsx or page.tsx).
 *
 * - Solar: UI icons (outline, 1.5px stroke)
 * - Simple Icons: brand logos (provider icons in settings)
 */
import { addCollection } from "@iconify/react";
import solarIcons from "@iconify-json/solar/icons.json";
import simpleIcons from "@iconify-json/simple-icons/icons.json";

addCollection(solarIcons);
addCollection(simpleIcons);
