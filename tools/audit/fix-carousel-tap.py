from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text(encoding='utf-8')
old = """      if (gesture.startedInCarousel && this.resultCarouselItems.length > 1) {\n        this.resultCarouselIndex = resolveCarouselIndex(\n          this.resultCarouselIndex,\n          this.resultCarouselItems.length,\n          gesture.deltaX,\n        );\n        this.positionResultCarousel(0, true);\n        if (this.lastReveal) this.renderResultActionPanel(this.lastReveal);\n        return;\n      }\n\n      const moved = Math.hypot(gesture.deltaX, gesture.deltaY);\n      if (\n        gesture.readyAtStart &&\n        this.resultReady &&\n        moved <= RESULT_PRESENTATION.tapMoveTolerance\n      ) {\n        this.continueFromResult();\n      }\n"""
new = """      const moved = Math.hypot(gesture.deltaX, gesture.deltaY);\n      if (gesture.startedInCarousel && this.resultCarouselItems.length > 1) {\n        this.resultCarouselIndex = resolveCarouselIndex(\n          this.resultCarouselIndex,\n          this.resultCarouselItems.length,\n          gesture.deltaX,\n        );\n        this.positionResultCarousel(0, true);\n        if (this.lastReveal) this.renderResultActionPanel(this.lastReveal);\n        if (\n          gesture.readyAtStart &&\n          this.resultReady &&\n          moved <= RESULT_PRESENTATION.tapMoveTolerance\n        ) {\n          this.continueFromResult();\n        }\n        return;\n      }\n\n      if (\n        gesture.readyAtStart &&\n        this.resultReady &&\n        moved <= RESULT_PRESENTATION.tapMoveTolerance\n      ) {\n        this.continueFromResult();\n      }\n"""
if old not in text:
    raise SystemExit('target input block not found')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
