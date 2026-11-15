import os
import re
from pptx import Presentation
from pptx.util import Inches

from deck_lib import reset_footer
from part1 import s01, s02, s03
from part_ba import s04, s05, s06, s07, s08, s09
from part2 import s05 as p2_s05, s06 as p2_s06, s07 as p2_s07, s08 as p2_s08, s09 as p2_s09
from part3 import s10 as p3_s10, s11 as p3_s11, s12 as p3_s12
from part4 import s14 as p4_s14, s16 as p4_s16, s17 as p4_s17

# Rehearsal timestamps (sum ≈ 15:45). The text of each note stays as written;
# only the trailing "(m:ss)" marker is normalized so the run sheet adds up.
TIMES = ["0:15", "0:20", "0:50", "0:55", "1:00", "1:00", "1:05", "1:05",
         "1:00", "0:50", "0:45", "0:55", "0:50", "0:55", "0:55", "0:45",
         "0:30", "0:45", "0:45", "0:20"]


def main():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    reset_footer()
    for fn in (s01, s02, s03, s04, s05, s06, s07, s08, s09,
               p2_s05, p2_s06, p2_s07, p2_s08, p2_s09,
               p3_s10, p3_s11, p3_s12,
               p4_s14, p4_s16, p4_s17):
        fn(prs)
    for slide, t in zip(prs.slides, TIMES):
        frame = slide.notes_slide.notes_text_frame
        frame.text = re.sub(r"\(\d+:\d+\)\s*$", f"({t})", frame.text)
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "SyncHub-Slide.pptx")
    prs.save(out)
    print("saved", out, os.path.getsize(out), "bytes", len(prs.slides), "slides")


if __name__ == "__main__":
    main()
