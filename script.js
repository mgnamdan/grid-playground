/* ===== Helpers ===== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const grid = $("#grid");
const cssPreview = $("#cssPreview");

const controls = {
  cols: $("#cols"),
  colsVal: $("#colsVal"),
  colMin: $("#colMin"),
  rowMin: $("#rowMin"),
  gap: $("#gap"),
  gapVal: $("#gapVal"),
  justifyItems: $("#justifyItems"),
  alignItems: $("#alignItems"),
  justifyContent: $("#justifyContent"),
  alignContent: $("#alignContent"),
  autoFlow: $("#autoFlow"),
  dense: $("#dense"),
  itemCount: $("#itemCount"),
  shuffle: $("#shuffle"),
  reset: $("#reset")
};

const itemCtrls = {
  selectedItem: $("#selectedItem"),
  colStart: $("#colStart"),
  colSpan: $("#colSpan"),
  rowStart: $("#rowStart"),
  rowSpan: $("#rowSpan"),
  justifySelf: $("#justifySelf"),
  alignSelf: $("#alignSelf")
};

const DEFAULTS = {
  container: {
    cols: 4,
    colMin: 140,
    rowMin: 80,
    gap: 12,
    justifyItems: "center",
    alignItems: "center",
    justifyContent: "center",
    alignContent: "center",
    autoFlow: "row",
    dense: false,
    itemCount: 8
  },
  item: {
    colStart: "auto",
    colSpan: 1,
    rowStart: "auto",
    rowSpan: 1,
    justifySelf: "center",
    alignSelf: "center"
  }
};

const palette = [8, 24, 45, 160, 205, 260, 300, 345];

/* ===== Item helpers ===== */
function createItem(i){
  const el = document.createElement("div");
  el.className = "item";
  el.style.setProperty("--h", palette[i % palette.length]);
  el.textContent = `Item ${i + 1}`;
  setItemPlacement(el, { ...DEFAULTS.item });
  return el;
}

function setItemPlacement(el, { colStart, colSpan, rowStart, rowSpan, justifySelf, alignSelf }){
  // grid-column: <start> / span <n>
  const colStartVal = (colStart + "").trim();
  const rowStartVal = (rowStart + "").trim();

  el.style.gridColumn = `${colStartVal || "auto"} / span ${Number(colSpan) || 1}`;
  el.style.gridRow = `${rowStartVal || "auto"} / span ${Number(rowSpan) || 1}`;

  el.style.justifySelf = justifySelf;
  el.style.alignSelf = alignSelf;

  // keep state
  el.dataset.colStart = colStartVal || "auto";
  el.dataset.colSpan = Number(colSpan) || 1;
  el.dataset.rowStart = rowStartVal || "auto";
  el.dataset.rowSpan = Number(rowSpan) || 1;
  el.dataset.justifySelf = justifySelf;
  el.dataset.alignSelf = alignSelf;
}

function populateItemSelect(){
  const sel = itemCtrls.selectedItem;
  sel.innerHTML = "";
  $$(".item", grid).forEach((el, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `Item ${i+1}`;
    sel.appendChild(opt);
  });
}

function getSelectedItem(){
  const i = Number(itemCtrls.selectedItem.value || 0);
  return $$(".item", grid)[i] || null;
}

function syncSelectedItemControls(){
  const el = getSelectedItem();
  if(!el) return;

  itemCtrls.colStart.value = el.dataset.colStart ?? DEFAULTS.item.colStart;
  itemCtrls.colSpan.value = Number(el.dataset.colSpan ?? DEFAULTS.item.colSpan);
  itemCtrls.rowStart.value = el.dataset.rowStart ?? DEFAULTS.item.rowStart;
  itemCtrls.rowSpan.value = Number(el.dataset.rowSpan ?? DEFAULTS.item.rowSpan);
  itemCtrls.justifySelf.value = el.dataset.justifySelf ?? DEFAULTS.item.justifySelf;
  itemCtrls.alignSelf.value = el.dataset.alignSelf ?? DEFAULTS.item.alignSelf;
}

/* ===== Container bindings ===== */
function applyContainerStyles(){
  const cols = Number(controls.cols.value);
  const colMin = Math.max(0, Number(controls.colMin.value));
  const rowMin = Math.max(0, Number(controls.rowMin.value));
  const gap = Number(controls.gap.value);

  const dense = controls.dense.checked;
  const flow = controls.autoFlow.value + (dense ? " dense" : "");

  // Build core grid CSS
  grid.style.gridTemplateColumns = `repeat(${cols}, minmax(${colMin}px, 1fr))`;
  grid.style.gridAutoRows = `minmax(${rowMin}px, auto)`;
  grid.style.gap = `${gap}px`;

  grid.style.justifyItems = controls.justifyItems.value;
  grid.style.alignItems = controls.alignItems.value;

  grid.style.justifyContent = controls.justifyContent.value;
  grid.style.alignContent = controls.alignContent.value;

  grid.style.gridAutoFlow = flow;

  // live labels
  controls.colsVal.textContent = cols;
  controls.gapVal.textContent = gap;

  updateCSSPreview();
}

function syncContainerControls(){
  controls.cols.value = DEFAULTS.container.cols;
  controls.colMin.value = DEFAULTS.container.colMin;
  controls.rowMin.value = DEFAULTS.container.rowMin;
  controls.gap.value = DEFAULTS.container.gap;
  controls.justifyItems.value = DEFAULTS.container.justifyItems;
  controls.alignItems.value = DEFAULTS.container.alignItems;
  controls.justifyContent.value = DEFAULTS.container.justifyContent;
  controls.alignContent.value = DEFAULTS.container.alignContent;
  controls.autoFlow.value = DEFAULTS.container.autoFlow;
  controls.dense.checked = DEFAULTS.container.dense;
  controls.itemCount.value = DEFAULTS.container.itemCount;

  controls.colsVal.textContent = DEFAULTS.container.cols;
  controls.gapVal.textContent = DEFAULTS.container.gap;
}

/* ===== Items mount ===== */
function mountItems(n){
  grid.innerHTML = "";
  for(let i=0;i<n;i++){
    grid.appendChild(createItem(i));
  }
  populateItemSelect();
  syncSelectedItemControls();
  updateCSSPreview();
}

/* ===== UI events ===== */
["change","input"].forEach(evt => {
  ["cols","colMin","rowMin","gap","justifyItems","alignItems","justifyContent","alignContent","autoFlow","dense"]
    .forEach(k => controls[k].addEventListener(evt, applyContainerStyles));

  ["colStart","colSpan","rowStart","rowSpan","justifySelf","alignSelf"]
    .forEach(k => itemCtrls[k].addEventListener(evt, applySelectedItemStyles));
});

controls.itemCount.addEventListener("input", e => {
  mountItems(Number(e.target.value));
  applyContainerStyles();
});

itemCtrls.selectedItem.addEventListener("change", syncSelectedItemControls);

controls.shuffle.addEventListener("click", () => {
  // randomize hues and optionally give a few items bigger spans
  const items = $$(".item", grid);
  items.forEach(el => {
    const hue = palette[Math.floor(Math.random()*palette.length)];
    el.style.setProperty("--h", hue);

    // 30% chance to span extra columns/rows (within bounds)
    if (Math.random() < 0.3){
      const maxCols = Number(controls.cols.value);
      const spanC = Math.min( Math.ceil(Math.random()*2)+0, maxCols ); // up to 3
      const spanR = Math.min( Math.ceil(Math.random()*2)+0, 3 );       // up to 3

      const startC = "auto";
      const startR = "auto";
      setItemPlacement(el, {
        colStart: startC,
        colSpan: spanC,
        rowStart: startR,
        rowSpan: spanR,
        justifySelf: el.dataset.justifySelf || DEFAULTS.item.justifySelf,
        alignSelf: el.dataset.alignSelf || DEFAULTS.item.alignSelf
      });
    } else {
      // reset to default spans, preserve self alignment
      setItemPlacement(el, {
        colStart: "auto",
        colSpan: 1,
        rowStart: "auto",
        rowSpan: 1,
        justifySelf: el.dataset.justifySelf || DEFAULTS.item.justifySelf,
        alignSelf: el.dataset.alignSelf || DEFAULTS.item.alignSelf
      });
    }
  });
  updateCSSPreview();
});

controls.reset.addEventListener("click", () => {
  syncContainerControls();
  mountItems(DEFAULTS.container.itemCount);
  applyContainerStyles();
});

/* Item apply */
function applySelectedItemStyles(){
  const el = getSelectedItem();
  if(!el) return;

  // sanitize inputs
  const colStart = itemCtrls.colStart.value.trim() || "auto";
  const colSpan = Math.max(1, Number(itemCtrls.colSpan.value || 1));
  const rowStart = itemCtrls.rowStart.value.trim() || "auto";
  const rowSpan = Math.max(1, Number(itemCtrls.rowSpan.value || 1));
  const justifySelf = itemCtrls.justifySelf.value;
  const alignSelf = itemCtrls.alignSelf.value;

  setItemPlacement(el, { colStart, colSpan, rowStart, rowSpan, justifySelf, alignSelf });
  updateCSSPreview();
}

/* CSS preview */
function updateCSSPreview(){
  const s = getComputedStyle(grid);
  const rules = [
    ["display", "grid"],
    ["grid-template-columns", s.gridTemplateColumns],
    ["grid-auto-rows", s.gridAutoRows],
    ["gap", s.gap],
    ["justify-items", s.justifyItems],
    ["align-items", s.alignItems],
    ["justify-content", s.justifyContent],
    ["align-content", s.alignContent],
    ["grid-auto-flow", s.gridAutoFlow],
  ];

  const lines = [
`/* Current container CSS */`,
`.grid-container {`,
...rules.map(([k,v]) => `  ${k}: ${v};`),
`}`
  ];

  // Show selected item overrides
  const el = getSelectedItem();
  if(el){
    const itemRules = [];
    if((el.style.gridColumn || "") !== "") itemRules.push(["grid-column", el.style.gridColumn]);
    if((el.style.gridRow || "") !== "") itemRules.push(["grid-row", el.style.gridRow]);
    if((el.style.justifySelf || "auto") !== "auto") itemRules.push(["justify-self", el.style.justifySelf]);
    if((el.style.alignSelf || "auto") !== "auto") itemRules.push(["align-self", el.style.alignSelf]);

    if(itemRules.length){
      const idx = Number(itemCtrls.selectedItem.value) + 1;
      lines.push("", `/* Selected item (${idx}) overrides */`, `.item:nth-child(${idx}) {`);
      lines.push(...itemRules.map(([k,v]) => `  ${k}: ${v};`));
      lines.push(`}`);
    }
  }

  cssPreview.textContent = lines.join("\n");
}

/* Init */
(function init(){
  syncContainerControls();
  mountItems(DEFAULTS.container.itemCount);
  applyContainerStyles();
})();