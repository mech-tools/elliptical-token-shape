/* ------------------------------------------------------ */
/* Elliptical Token Shape
/* Author: Maxime
/* Discord: Maxime1562
/* Software License: AGPL-3.0
/* Repository: https://github.com/mech-tools/elliptical-token-shape
/* ------------------------------------------------------ */

/* -------------------------------------------- */
/*  PIXI Ellipse polygon method
/* -------------------------------------------- */

PIXI.Ellipse.prototype.toPolygon = function (steps = 32) {
  const points = [];
  const { x, y, width, height } = this;

  for (let i = 0; i < steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    points.push(x + Math.cos(theta) * width, y + Math.sin(theta) * height);
  }

  return new PIXI.Polygon(points);
};

/* -------------------------------------------- */
/* Foundry VTT Initialization
/* -------------------------------------------- */

const SETTINGS = {
  PCS: "pcs",
  NPCS: "npcs",
};

Hooks.once("init", () => {
  game.settings.register("elliptical-token-shape", SETTINGS.PCS, {
    name: game.i18n.localize(`elliptical-token-shape.${SETTINGS.PCS}-name`),
    hint: game.i18n.localize(`elliptical-token-shape.${SETTINGS.PCS}-hint`),
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true,
  });

  game.settings.register("elliptical-token-shape", SETTINGS.NPCS, {
    name: game.i18n.localize(`elliptical-token-shape.${SETTINGS.NPCS}-name`),
    hint: game.i18n.localize(`elliptical-token-shape.${SETTINGS.NPCS}-hint`),
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true,
  });
});

/* -------------------------------------------- */
/* Foundry VTT Setup (libWrapper is ready)
/* -------------------------------------------- */

Hooks.once("setup", () => {
  const pcs = game.settings.get("elliptical-token-shape", SETTINGS.PCS);
  const npcs = game.settings.get("elliptical-token-shape", SETTINGS.NPCS);

  // Add an ellipse option even if not available
  libWrapper.register(
    "elliptical-token-shape",
    "foundry.applications.sheets.TokenConfig.prototype._prepareAppearanceTab",
    async function (wrapped, ...args) {
      const result = await wrapped(...args);
      if (result.shapes && !result.shapes[CONST.TOKEN_SHAPES.ELLIPSE_1]) {
        result.shapes[CONST.TOKEN_SHAPES.ELLIPSE_1] = game.i18n.localize(
          "TOKEN.SHAPES.ELLIPSE.label",
        );
      }
      return result;
    },
    libWrapper.WRAPPER,
  );

  // Manage token initialization on scenes
  libWrapper.register(
    "elliptical-token-shape",
    "foundry.documents.TokenDocument.prototype._initializeSource",
    function (wrapper, ...args) {
      args[0].shape ??= (this.parent?.grid ?? foundry.documents.BaseScene.defaultGrid).isHexagonal
        ? CONST.TOKEN_SHAPES.TRAPEZOID_1
        : CONST.TOKEN_SHAPES.RECTANGLE_1;
      return wrapper(...args);
    },
    libWrapper.WRAPPER,
  );

  // Manage ellipse option on all grid types
  libWrapper.register(
    "elliptical-token-shape",
    "foundry.canvas.placeables.Token.prototype.getShape",
    function (wrapper, ...args) {
      const shape = this.document.shape;
      if (
        (!this.scene.grid.isGridless &&
          (shape === CONST.TOKEN_SHAPES.ELLIPSE_1 || shape === CONST.TOKEN_SHAPES.ELLIPSE_2)) ||
        (pcs && this.document.actor && this.document.actor.hasPlayerOwner) ||
        (npcs && this.document.actor && !this.document.actor.hasPlayerOwner)
      ) {
        const { width, height } = this.document.getSize();
        if (width === height) {
          const radius = width / 2;
          return new PIXI.Circle(radius, radius, radius);
        }
        const radiusX = width / 2;
        const radiusY = height / 2;
        return new PIXI.Ellipse(radiusX, radiusY, radiusX, radiusY);
      } else return wrapper(...args);
    },
    libWrapper.MIXED,
  );
});
