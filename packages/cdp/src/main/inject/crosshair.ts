export function crosshair() {
    const BACKGROUND_DEFAULT = 'rgba(0,0,0,.25)';
    const BACKGROUND_ACTIVE = 'rgba(32,144,192,1)';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createMousePointer);
    } else {
        createMousePointer();
    }

    function createMousePointer() {
        const pointer = createPointer();
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseenter', onMouseEnter);
        document.addEventListener('mouseleave', onMouseLeave);
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);

        addFramesListeners();

        function onMouseMove(ev: MouseEvent) {
            pointer.style.transform = `translate(${ev.clientX}px, ${ev.clientY}px)`;
            pointer.style.webkitTransform = `translate(${ev.clientX}px, ${ev.clientY}px)`;
        }

        function onMouseEnter() {
            show();
        }

        function onMouseLeave() {
            hide();
        }

        function onMouseDown() {
            pointer.style.backgroundColor = BACKGROUND_ACTIVE;
        }

        function onMouseUp() {
            pointer.style.backgroundColor = BACKGROUND_DEFAULT;
        }

        function show() {
            pointer.style.visibility = 'visible';
        }

        function hide() {
            pointer.style.visibility = 'hidden';
        }

        function addFramesListeners() {
            const frames = document.querySelectorAll('frame, iframe');
            for (const frame of frames) {
                if ((frame as any)['%%AP_MOUSE_WATCH%%']) {
                    return;
                }
                (frame as any)['%%AP_MOUSE_WATCH%%'] = true;
                frame.addEventListener('mouseenter', hide);
                frame.addEventListener('mouseleave', show);
            }
        }

        function createPointer() {
            const host = document.createElement('div');
            document.documentElement.appendChild(host);
            host.style.zIndex = '9999999';
            host.style.position = 'fixed';
            host.style.top = '0';
            host.style.left = '0';

            const root = host.attachShadow({ mode: 'open' });
            const pointer = document.createElement('div');
            root.appendChild(pointer);

            pointer.style.position = 'absolute';
            pointer.style.top = '0';
            pointer.style.left = '0';
            pointer.style.width = '7px';
            pointer.style.height = '7px';
            pointer.style.marginTop = '-3px';
            pointer.style.marginLeft = '-3px';
            pointer.style.backgroundColor = BACKGROUND_DEFAULT;
            pointer.style.pointerEvents = 'none';
            pointer.style.borderRadius = '100%';
            pointer.style.visibility = 'hidden';

            const xAxis = document.createElement('div');
            pointer.appendChild(xAxis);
            xAxis.style.position = 'relative';
            xAxis.style.borderBottom = '1px dotted rgba(0,0,0,.25)';
            xAxis.style.top = '3px';
            xAxis.style.height = '0';
            xAxis.style.width = '200vw';
            xAxis.style.marginLeft = '-100vw';

            const yAxis = document.createElement('div');
            pointer.appendChild(yAxis);
            yAxis.style.position = 'relative';
            yAxis.style.borderRight = '1px dotted rgba(0,0,0,.25)';
            yAxis.style.left = '3px';
            yAxis.style.width = '0';
            yAxis.style.height = '200vh';
            yAxis.style.marginTop = '-100vh';

            return pointer;
        }
    }
}
