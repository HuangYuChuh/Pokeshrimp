/**
 * Pre-load Solar icon set from local package so Iconify never hits CDN.
 * Import this file once at app root (layout.tsx or page.tsx).
 */
import { addCollection } from "@iconify/react";
import solarIcons from "@iconify-json/solar/icons.json";

addCollection(solarIcons);
