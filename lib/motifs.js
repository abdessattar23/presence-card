// lib/motifs.js — shared decoration primitives for theme authors.
//
// These run in BOTH renderers: Node (api/card.js builds the SVG card) and
// the browser (index.html imports themes as ES modules). Keep this file
// dependency-free and side-effect-free.

export const MONO = `ui-monospace,'Cascadia Code','Fira Code',Consolas,'Courier New',monospace`;
export const SANS = `'Segoe UI',Ubuntu,Helvetica,Arial,sans-serif`;

/** Wrap SVG inner markup in a standalone <svg> document. */
export const svgWrap = (w, h, inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${inner}</svg>`;

/** Turn an SVG document into a CSS url(...) data URI. */
export const dataUri = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

// ---------------------------------------------------------------- zellij
// Khatim (eight-pointed star) = two overlapping squares. The atom of
// Moroccan tilework.

/** Filled eight-pointed star centered at (x, y). */
export const star = (fill, x, y, r = 8) =>
  `<g fill="${fill}" transform="translate(${x},${y})">` +
  `<rect x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}"/>` +
  `<rect x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" transform="rotate(45)"/></g>`;

/** Small filled diamond centered at (x, y). */
export const diamond = (fill, x, y, r = 4.4) =>
  `<rect x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}" transform="rotate(45 ${x} ${y})" fill="${fill}"/>`;

/**
 * One 36×36 tile of real zellij: a star in the middle (c1), quarter-stars
 * in the corners (c2), diamonds in the gaps (c3), grout lines between
 * every piece. Tessellates in any direction.
 */
export const mosaicTile = ({ grout, field, c1, c2, c3 }) => `
  <rect width="36" height="36" fill="${field}"/>
  <g stroke="${grout}" stroke-width="1.4" stroke-linejoin="round">
    ${star(c1, 18, 18)}
    ${star(c2, 0, 0)}${star(c2, 36, 0)}${star(c2, 0, 36)}${star(c2, 36, 36)}
    ${diamond(c3, 18, 0)}${diamond(c3, 0, 18)}${diamond(c3, 36, 18)}${diamond(c3, 18, 36)}
  </g>`;

/** The same tile as a repeating SVG <pattern>, for use inside decor(). */
export const mosaicPattern = (id, colors) =>
  `<pattern id="${id}" width="36" height="36" patternUnits="userSpaceOnUse">${mosaicTile(colors)}</pattern>`;

/**
 * Sixteen-fold rosette outline, centered at (0,0), radius ~80 — the big
 * geometric watermark floating in the card's whitespace.
 */
export const rosetteMotif = (stroke, opacity) => `
  <g fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.5">
    <rect x="-56" y="-56" width="112" height="112"/>
    <rect x="-56" y="-56" width="112" height="112" transform="rotate(45)"/>
    <rect x="-34" y="-34" width="68" height="68" transform="rotate(22.5)"/>
    <rect x="-34" y="-34" width="68" height="68" transform="rotate(67.5)"/>
    <circle r="14"/>
  </g>`;

/**
 * 64×64 tile of faint star outlines (a checkered star field) — page
 * background texture behind the card.
 */
export const starfieldTile = (stroke, opacity) => `
  <defs><g id="k" fill="none" stroke="${stroke}" stroke-opacity="${opacity}">
    <rect x="-10" y="-10" width="20" height="20"/>
    <rect x="-10" y="-10" width="20" height="20" transform="rotate(45)"/>
  </g></defs>
  <use href="#k" x="32" y="32"/><use href="#k"/><use href="#k" x="64"/>
  <use href="#k" y="64"/><use href="#k" x="64" y="64"/>`;
