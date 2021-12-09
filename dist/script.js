import DeviceDetector from "https://cdn.skypack.dev/device-detector-js@2.2.10";
// Usage: testSupport({client?: string, os?: string}[])
// Client and os are regular expressions.
// See: https://cdn.jsdelivr.net/npm/device-detector-js@2.2.10/README.md for
// legal values for client and os
testSupport([
    { client: 'Chrome' },
]);
function testSupport(supportedDevices) {
    const deviceDetector = new DeviceDetector();
    const detectedDevice = deviceDetector.parse(navigator.userAgent);
    let isSupported = false;
    for (const device of supportedDevices) {
        if (device.client !== undefined) {
            const re = new RegExp(`^${device.client}$`);
            if (!re.test(detectedDevice.client.name)) {
                continue;
            }
        }
        if (device.os !== undefined) {
            const re = new RegExp(`^${device.os}$`);
            if (!re.test(detectedDevice.os.name)) {
                continue;
            }
        }
        isSupported = true;
        break;
    }
    if (!isSupported) {
        alert(`This demo, running on ${detectedDevice.client.name}/${detectedDevice.os.name}, ` +
            `is not well supported at this time, continue at your own risk.`);
    }
}
// Our input frames will come from here.
const videoElement = document.getElementsByClassName("input_video")[0];
const canvasElement = document.getElementsByClassName("output_canvas")[0];
const canvasCtx = canvasElement.getContext("2d");
var landmarksA;
var landmarksB;
function onResults(results) {
    landmarksA = [];
    landmarksB = [];
    if (results.multiFaceLandmarks[0] !== undefined) {
        landmarksA = results.multiFaceLandmarks[0];
        console.log("first face");
    }
    if (results.multiFaceLandmarks[1] !== undefined) {
        landmarksB = results.multiFaceLandmarks[1];
        console.log("second face");
    }
    canvasCtx.restore();
}
const faceMesh = new FaceMesh({ locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`;
    } });
faceMesh.onResults(onResults);
faceMesh.setOptions({
    selfieMode: true,
    maxNumFaces: 1,
    minDetectionConfidence: 0.75,
    minTrackingConfidence: 0.75
});
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await faceMesh.send({ image: videoElement });
    },
    width: 100,
    height: 100
});
camera.start();
///////////Begin Plexus
{
    const c = document.getElementById("canvas").getContext("2d");
    const { canvas } = c;
    const points = [];
    // Properties
    const pointsCount = 464;
    const pointRadius = 1;
    const pointVelocity = 1;
    const freeDist = (canvas.width * 1 + canvas.height * 1) / 2 / 5;
    const faceDist = freeDist;
    var maxDistBetweenPoint = freeDist;
    const maxLineWidth = 1;
    const renderPoints = true;
    const bokehBackground = false;
    const glow = false;
    //
    let frame = 0;
    const resize = () => {
        if (canvas.width !== window.innerWidth ||
            canvas.height !== window.innerHeight) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    };
    const renderLines = (point) => {
        for (let i = 0; i < points.length; i++) {
            if (i % 2 == 0) {
                const _p = points[i];
                const _d = Math.sqrt((point.x - _p.x) ** 2 + (point.y - _p.y) ** 2);
                if (_d > maxDistBetweenPoint)
                    continue;
                let alpha = Math.min(1, Math.max(0, 1 - _d / maxDistBetweenPoint));
                c.save();
                c.globalAlpha = alpha;
                c.lineWidth = maxLineWidth; //* alpha;
                c.strokeStyle = `hsl(${point.x + point.y}deg , 80%, 85%)`;
                c.beginPath();
                c.moveTo(point.x, point.y);
                c.lineTo(_p.x, _p.y);
                c.stroke();
                c.restore();
            }
        }
    };
    const loop = () => {
        frame++;
        requestAnimationFrame(loop);
        resize();
        c.fillStyle = "#000";
        c.fillRect(0, 0, canvas.width, canvas.height);
        c.fillStyle = "#fff";
        points.forEach(function (point, index) {
            if (renderPoints) {
                c.beginPath();
                c.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
                c.fill();
            }
            var indexOffset = 0;
            var landmarks = landmarksA;
            if (index % 2 == 0 && landmarks !== undefined && landmarks[index] !== undefined) {
                maxDistBetweenPoint = faceDist;
                point.y =
                    ((landmarks[index].y * canvas.width +
                        (canvas.height - canvas.width) / 2) + point.y * 3) / 4;
                point.x = ((landmarks[index].x * canvas.width) + point.x * 3) / 4;
            }
            else {
                maxDistBetweenPoint = freeDist;
                point.x += point.velocity.x;
                point.y += point.velocity.y;
            }
            if (point.x < -2) {
                point.x = 0;
                point.velocity.x = -point.velocity.x;
            }
            if (point.x > canvas.width + 2) {
                point.x = canvas.width;
                point.velocity.x = -point.velocity.x;
            }
            if (point.y < -2) {
                point.y = 0;
                point.velocity.y = -point.velocity.y;
            }
            if (point.y > canvas.height + 2) {
                point.y = canvas.height;
                point.velocity.y = -point.velocity.y;
            }
            renderLines(point);
        });
        c.save();
        //c.globalCompositeOperation = "screen";
        //c.filter = "blur(2px)";
        c.drawImage(canvas, 0, 0);
        c.restore();
        if (bokehBackground) {
        }
    };
    resize();
    for (let i = 0; i < pointsCount; i++) {
        points.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            velocity: {
                x: -pointVelocity + Math.random() * pointVelocity * 2,
                y: -pointVelocity + Math.random() * pointVelocity * 2
            }
        });
    }
    loop();
}