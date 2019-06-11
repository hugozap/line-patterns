import "react-dat-gui/build/react-dat-gui.css";
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import "./styles.css";
import SimplexNoise from "simplex-noise";
import DatGui, { DatColor, DatNumber } from "react-dat-gui";
const noise = new SimplexNoise();

const AppContainer = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr;
  grid-column-gap: 0px;
  grid-row-gap: 0px;
`;

const StyedDatGui = styled(DatGui)`
  position: relative !important;
  display: inline-block !important;
  right: 0 !important;
`;

function map(x, in_min, in_max, out_min, out_max) {
  return ((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
}

function importSVG(sourceSVG, targetCanvas) {
  // https://developer.mozilla.org/en/XMLSerializer
  let svg_xml = new XMLSerializer().serializeToString(sourceSVG);
  var ctx = targetCanvas.getContext("2d");
  ctx.clearRect(0, 0, 1000, 1000);

  // this is just a JavaScript (HTML) image
  var img = new Image();
  // http://en.wikipedia.org/wiki/SVG#Native_support
  // https://developer.mozilla.org/en/DOM/window.btoa
  img.src = "data:image/svg+xml;base64," + btoa(svg_xml);

  img.onload = function() {
    // after this, Canvas’ origin-clean is DIRTY
    ctx.drawImage(img, 0, 0);
  };
}

function saveSvg(svgEl, name) {
  svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  var svgData = svgEl.outerHTML;
  var preface = '<?xml version="1.0" standalone="no"?>\r\n';
  var svgBlob = new Blob([preface, svgData], {
    type: "image/svg+xml;charset=utf-8"
  });
  var svgUrl = URL.createObjectURL(svgBlob);
  var downloadLink = document.createElement("a");
  downloadLink.href = svgUrl;
  downloadLink.download = name;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

const PanelOpciones = props => {
  return (
    <StyedDatGui data={props.params} onUpdate={props.onUpdate}>
      <DatNumber
        path="numLineas"
        label="Line Count"
        min={1}
        max={100}
        step={1}
      />
      <DatNumber
        path="numSegmentos"
        label="Segments"
        min={1}
        max={100}
        step={1}
      />
      <DatColor path="lineColor" label="Stroke" />
      <DatNumber
        path="strokeWidth"
        label="Stroke width"
        min={0.1}
        max={1.0}
        step={0.05}
      />
      <DatNumber path="chaosX" label="X noise" min={0} max={1.0} step={0.05} />
      <DatNumber path="chaosY" label="Y noise" min={0} max={1.0} step={0.05} />
      <DatNumber
        path="vpadding"
        label="VPadding"
        min={0}
        max={1}
        step={0.05}
      />
    </StyedDatGui>
  );
};

const StyledOpciones = styled(PanelOpciones)`
  grid-area: 1 / 2 / 2 / 3;
  background-color: black;
  height: 100%;
`;

const ContentArea = styled.div`
  overflow: auto;
  background-color: white;
  grid-area: 1 / 1 / 2 / 2;
  text-align: center;
`;

const CanvasContainer = styled.div`
  display: inline-block;
  width: 500px;
  height: 500px;
`;

const HeaderComment = styled.p`
  width: 100%;
  background-color: #4169e1;
  color: white;
  a {
   color:white;
  }
`

/**
 * Pinta una linea
 */
const Line = opts => {
  const lineNumber = opts.lineNumber;
  const ly = lineNumber * opts.offsety;
  //Dividir en n segmentos, trazar linea desde 0, 0.5 del segmento
  // a un punto aleatorio en la mitad y luego de dicho punto a 1, 0.5
  let numSegmentos = opts.numSegmentos;
  let segmentWidth = opts.w / numSegmentos;

  let segmentos = Array(numSegmentos)
    .fill()
    .map((_, i) => {
      const segmentNumber = i;
      const rval = noise.noise2D(lineNumber, segmentNumber);
      return {
        w: segmentWidth,
        h: opts.offsety,
        i: i,
        p1: [segmentWidth * i, ly],
        p2: [segmentWidth * i + segmentWidth, ly],
        midpoint: [
          //mapear de rango -1,1
          map(
            rval,
            -1,
            1,
            -segmentWidth * opts.chaosX,
            segmentWidth * opts.chaosX
          ),
          map(
            rval,
            -1,
            1,
            -opts.offsety * opts.chaosY,
            opts.offsety * opts.chaosY
          )
        ]
      };
    })
    .map(s => {
      return {
        ...s,
        str: `M${s.p1[0]} ${s.p1[1]} l${s.midpoint[0]} ${s.midpoint[1]} L${
          s.p2[0]
        } ${s.p2[1]}`
      };
    });

  const d = ``;

  let fulld = segmentos.reduce((prev, cur, curIndex) => {
    return `${prev || ""} ${cur.str} `;
  }, d);

  return (
    <path
      stroke={opts.lineColor}
      strokeWidth={opts.strokeWidth}
      fill="none"
      d={fulld}
    />
  );
};

const Canvas = opts => {
  let numLineas = opts.numLineas;
  let w = 100;
  let h = 100;
  let vpadding = opts.vpadding;
  let lineas = Array(numLineas)
    .fill()
    .map(_ => {
      return 1;
    });

  const lineHeight = h / numLineas;
  const offsety = lineHeight * vpadding;
  return (
    <CanvasContainer>
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
        {lineas.map((l, i) => {
          return (
            <Line
              offsety={offsety}
              w={w}
              lineNumber={i+1}
              numSegmentos={opts.numSegmentos}
              lineColor={opts.lineColor}
              strokeWidth={opts.strokeWidth}
              chaosX={opts.chaosX}
              chaosY={opts.chaosY}
            />
          );
        })}
      </svg>
    </CanvasContainer>
  );
};
function App() {
  const [params, setParams] = useState({
    numLineas: 40,
    strokeWidth: 0.2,
    lineColor: "black",
    numSegmentos: 50,
    chaosX: 0.5, //Influye en la dirección de los segumentos
    chaosY: 0.95 //Influye en la dirección de los segumentos
    ,vpadding: 0.9,
  });

  useEffect(() => {
    importSVG(document.querySelector("svg"), document.querySelector("#canvas"));
  });
  const exportFile = () => {
    saveSvg(document.querySelector("svg"), "pattern.svg");
  };

  return (
    <AppContainer>
      <StyledOpciones params={params} onUpdate={setParams} />
      <ContentArea>
                <h1>
          SVG <button onClick={exportFile}>Export SVG</button>{" "}
        </h1>
        <Canvas
          numLineas={params.numLineas}
          strokeWidth={params.strokeWidth}
          lineColor={params.lineColor}
          numSegmentos={params.numSegmentos}
          chaosX={params.chaosX}
          chaosY={params.chaosY}
          vpadding={params.vpadding}
        />
        <h1>PNG</h1>
        <CanvasContainer>
          <canvas alt="pattern" id="canvas" width="500px" height="500px" />
        </CanvasContainer>
  <HeaderComment>Non symmetrical zig zag line pattern generator. With 💙 by <a href="https://hugozap.com">hugozap</a> </HeaderComment>
    </ContentArea>
    </AppContainer>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
