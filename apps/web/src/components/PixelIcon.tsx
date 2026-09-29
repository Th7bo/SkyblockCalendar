import type { CategoryId, Season } from "@sbcal/core";
import { memo } from "react";

/** 10×10 sprites; each character maps to a colour in the sprite's palette, "." is transparent. */
interface Sprite {
  palette: Record<string, string>;
  rows: string[];
}

const SPRITES: Record<CategoryId | Season, Sprite> = {
  spooky: {
    palette: { o: "#E8841A", O: "#A9550C", g: "#5C9A2E", y: "#FFE066" },
    rows: [
      "....gg....",
      "..OoggooO.",
      ".Oooooooo.",
      "OoyyooyyoO",
      "OoyyooyyoO",
      "OooooooooO",
      "OoyyyyyyoO",
      "OooyooyooO",
      ".OooooooO.",
      "..OOOOOO..",
    ],
  },
  zoo: {
    palette: { p: "#D8B48A" },
    rows: [
      "..pp..pp..",
      "..pp..pp..",
      "p........p",
      "pp......pp",
      "pp.pppp.pp",
      "..pppppp..",
      ".pppppppp.",
      ".pppppppp.",
      "..pp..pp..",
      "..........",
    ],
  },
  jerry: {
    palette: { r: "#E0404A", R: "#9E1F28", w: "#F4F4F4" },
    rows: [
      "..w....w..",
      "...w..w...",
      "....ww....",
      "rrrrwwrrrr",
      "rrrrwwrrrr",
      "wwwwwwwwww",
      "RrrrwwrrrR",
      "RrrrwwrrrR",
      "RrrrwwrrrR",
      "RRRRwwRRRR",
    ],
  },
  new_year: {
    palette: { f: "#FFB020", w: "#F4F4F4", c: "#F4EBDD", r: "#E0404A", b: "#A0622D" },
    rows: [
      "....f.....",
      "....w.....",
      "....w.....",
      ".cccccccc.",
      "crccrccrcc",
      "cccccccccc",
      "bbbbbbbbbb",
      "cccccccccc",
      "bbbbbbbbbb",
      "..........",
    ],
  },
  hoppity: {
    palette: { e: "#F8DDF3", E: "#E27BD6" },
    rows: [
      "...eeee...",
      "..eeeeee..",
      ".eeeeeeee.",
      ".EEEEEEEE.",
      "eeeeeeeeee",
      "eEeEeEeEee",
      "eeeeeeeeee",
      ".EEEEEEEE.",
      ".eeeeeeee.",
      "..eeeeee..",
    ],
  },
  harvest_feast: {
    palette: { y: "#F2C45A", Y: "#B8862A", d: "#9AA0AA", D: "#6B707A" },
    rows: [
      "..........",
      "..........",
      "...yyyy...",
      ".yYyyyyYy.",
      "yyyyYyyyyy",
      "YyYyYyYyYy",
      "dddddddddd",
      ".DDDDDDDD.",
      "..........",
      "..........",
    ],
  },
  election: {
    palette: { w: "#EEEEEE", k: "#6A6A6A", b: "#2FB5B5", B: "#1C7C7C" },
    rows: [
      "...wwww...",
      "...wkkw...",
      "...wwww...",
      "bbbkkkkbbb",
      "bBBBBBBBBb",
      "bBBBBBBBBb",
      "bBBwwwwBBb",
      "bBBBBBBBBb",
      "bBBBBBBBBb",
      "bbbbbbbbbb",
    ],
  },
  fishing_festival: {
    palette: { f: "#4FB3F7", F: "#1D6FB0", k: "#101018" },
    rows: [
      "..........",
      ".....FFF..",
      "...fffffF.",
      "F.fffffkff",
      "FFffffffff",
      "FFffffffff",
      "F.fffffff.",
      "...fffff..",
      ".....FF...",
      "..........",
    ],
  },
  mining_fiesta: {
    palette: { h: "#9BE9EC", H: "#4FB8BE", s: "#9A6A35" },
    rows: [
      "...hhhh...",
      "..H..hhh..",
      "......shh.",
      ".....s.hh.",
      "....s...H.",
      "...s......",
      "..s.......",
      ".s........",
      "s.........",
      "..........",
    ],
  },
  mythological: {
    palette: { f: "#3CCB85", F: "#1C7A4C", q: "#E8E8E8" },
    rows: [
      "........fF",
      ".......fFf",
      "......fFf.",
      ".....fFf..",
      "....fFf...",
      "...fFf....",
      "..fFf.....",
      ".qFf......",
      ".q........",
      "q.........",
    ],
  },
  cult: {
    palette: { s: "#8A8AFF", S: "#4B4BD8" },
    rows: [
      "....ss....",
      "....ss....",
      "...ssss...",
      "ssssssssss",
      ".ssssssss.",
      "..ssssss..",
      "..ssSSss..",
      ".sss..sss.",
      ".ss....ss.",
      "s........s",
    ],
  },
  dark_auction: {
    palette: { g: "#C040C0", G: "#7A1F7A", w: "#9A6A35", k: "#4A3020" },
    rows: [
      "..GggggG..",
      "..gggggg..",
      "..GggggG..",
      "....ww....",
      "....ww....",
      "....ww....",
      "....ww....",
      "..kkkkkk..",
      ".kkkkkkkk.",
      "..........",
    ],
  },
  jacob: {
    palette: { y: "#FFE45A", Y: "#C8A83A", g: "#6FA83A" },
    rows: [
      "....y.....",
      "...yYy....",
      "...yYy.y..",
      ".y.yYyyYy.",
      ".yYyYy.y..",
      "..yygyg...",
      "....g.....",
      "....g.....",
      "....g.....",
      "....g.....",
    ],
  },
  bank: {
    palette: { o: "#FFB020", O: "#B87400", y: "#FFE39A" },
    rows: [
      "...oooo...",
      ".oooooooo.",
      ".oyyooooO.",
      "ooyooooooO",
      "ooyooooooO",
      "oooooooooO",
      "ooooooooOO",
      ".oooooooO.",
      ".OOOOOOOO.",
      "...OOOO...",
    ],
  },
  spring: {
    palette: { g: "#55C855", b: "#8A5A2B" },
    rows: [
      "..........",
      "....gg....",
      "...gggg...",
      "..gg.ggg..",
      "....gg.gg.",
      ".gg.g.....",
      "..ggg.....",
      "....b.....",
      "....b.....",
      "..........",
    ],
  },
  summer: {
    palette: { y: "#FFD84A" },
    rows: [
      "....y.....",
      ".y.....y..",
      "...yyy....",
      "..yyyyy...",
      "yyyyyyyyy.",
      "..yyyyy...",
      "...yyy....",
      ".y.....y..",
      "....y.....",
      "..........",
    ],
  },
  autumn: {
    palette: { o: "#E0782A", O: "#9A4A14" },
    rows: [
      ".......oo.",
      ".....oooo.",
      "...ooooOo.",
      "..oooOooo.",
      ".oooOoooo.",
      ".ooOoooo..",
      ".oOooooo..",
      ".Ooooo....",
      "O.........",
      "..........",
    ],
  },
  winter: {
    palette: { w: "#CFEFFF" },
    rows: [
      "....w.....",
      ".w..w..w..",
      "..w.w.w...",
      "...www....",
      "wwwwwwwww.",
      "...www....",
      "..w.w.w...",
      ".w..w..w..",
      "....w.....",
      "..........",
    ],
  },
};

interface Props {
  name: CategoryId | Season;
  className?: string;
  muted?: boolean;
}

export const PixelIcon = memo(function PixelIcon({ name, className, muted }: Props) {
  const { palette, rows } = SPRITES[name];
  const rects = [];
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y]!;
    for (let x = 0; x < row.length; x++) {
      const fill = palette[row[x]!];
      if (fill) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={fill} />);
    }
  }
  return (
    <svg
      viewBox="0 0 10 10"
      shapeRendering="crispEdges"
      aria-hidden
      className={className}
      style={muted ? { filter: "grayscale(1) brightness(0.55)" } : undefined}
    >
      {rects}
    </svg>
  );
});
