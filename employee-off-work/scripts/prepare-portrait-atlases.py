"""Convert approved transparent animations to Cocos PNG sheets; metadata stays editor-owned."""
from pathlib import Path
from PIL import Image
import json

project = Path(__file__).resolve().parent.parent
source = project.parent / '美术' / '猫猫表情-Seedance' / '透明动画'
target = project / 'assets' / 'art' / 'character'
cell, gutter, columns = 128, 2, 8
stride = cell + gutter * 2
names = ['工作负荷0-轻松', '工作负荷1-担心', '工作负荷2-焦急']
report = []
for workload, name in enumerate(names):
    with Image.open(source / (name + '-头像.apng')) as animation:
        count = animation.n_frames
        sheet = Image.new('RGBA', (stride * columns, stride * ((count + columns - 1) // columns)))
        for index in range(count):
            animation.seek(index)
            frame = animation.convert('RGBA').resize((cell, cell), Image.Resampling.LANCZOS)
            sheet.paste(frame, (index % columns * stride + gutter, index // columns * stride + gutter))
        file = target / f'workload-expression-{workload}.png'
        sheet.save(file)
        with Image.open(file) as check:
            assert check.size == (1056, 1056) and check.mode == 'RGBA'
        report.append({'workload': workload, 'frames': count, 'cell': cell, 'gutter': gutter,
                       'columns': columns, 'size': sheet.size, 'bytes': file.stat().st_size})
        print(file.name, count, 'frames', file.stat().st_size, 'bytes')
assert all(item['frames'] == 61 for item in report)
(project / 'temp' / 'portrait-atlas-validation.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
