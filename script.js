const profileInput = document.getElementById('profileInput');
const maskGallery = document.getElementById('maskGallery');
const canvas = document.getElementById('pfpCanvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('downloadBtn');
const cropperImage = document.getElementById('cropperImage');
const cropConfirmBtn = document.getElementById('cropConfirmBtn');

let profileImg = null;
let maskImg = null;
let cropper = null;

let maskPosition = { x: 0, y: 0 };
let maskAngle = 0;
let maskScale = 0.35;
let isDragging = false;
let isRotating = false;
let dragOffset = { x: 0, y: 0 };
let rotateStartAngle = 0;

profileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    cropperImage.src = e.target.result;
    if (cropper) cropper.destroy();
    cropper = new Cropper(cropperImage, {
      aspectRatio: 1,
      viewMode: 1,
      autoCropArea: 1,
    });
  };
  reader.readAsDataURL(file);
});

cropConfirmBtn.addEventListener('click', () => {
  if (!cropper) return;
  const canvasData = cropper.getCroppedCanvas({ width: 512, height: 512 });
  const croppedImg = new Image();
  croppedImg.onload = () => {
    profileImg = croppedImg;
    centerMask();
    drawPFP();
  };
  croppedImg.src = canvasData.toDataURL();
});

maskGallery.querySelectorAll('img').forEach(imgEl => {
  imgEl.addEventListener('click', () => {
    maskGallery.querySelectorAll('img').forEach(i => i.classList.remove('selected'));
    imgEl.classList.add('selected');

    const img = new Image();
    img.onload = () => {
      maskImg = img;
      centerMask();
      drawPFP();
    };
    img.src = imgEl.src;
  });
});

function centerMask() {
  if (!profileImg || !maskImg) return;
  const scaledWidth = maskImg.width * maskScale;
  const scaledHeight = maskImg.height * maskScale;
  maskPosition.x = (canvas.width - scaledWidth) / 2;
  maskPosition.y = (canvas.height - scaledHeight) / 2;
}

function drawPFP() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (profileImg) {
    ctx.drawImage(profileImg, 0, 0, canvas.width, canvas.height);
  }
  if (maskImg) {
    const scaledWidth = maskImg.width * maskScale;
    const scaledHeight = maskImg.height * maskScale;
    ctx.save();
    ctx.translate(maskPosition.x + scaledWidth / 2, maskPosition.y + scaledHeight / 2);
    ctx.rotate(maskAngle);
    ctx.drawImage(maskImg, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
    ctx.restore();
    const centerX = maskPosition.x + scaledWidth / 2;
    const centerY = maskPosition.y + scaledHeight / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY - scaledHeight / 2 - 20, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
  }
}

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  if (!maskImg) return;
  const scaledWidth = maskImg.width * maskScale;
  const scaledHeight = maskImg.height * maskScale;
  if (
    mouseX >= maskPosition.x &&
    mouseX <= maskPosition.x + scaledWidth &&
    mouseY >= maskPosition.y &&
    mouseY <= maskPosition.y + scaledHeight
    ) {
    isDragging = true;
  dragOffset.x = mouseX - maskPosition.x;
  dragOffset.y = mouseY - maskPosition.y;
  return;
}
const centerX = maskPosition.x + scaledWidth / 2;
const centerY = maskPosition.y + scaledHeight / 2;
const dx = mouseX - centerX;
const dy = mouseY - (centerY - scaledHeight / 2 - 20);
if (Math.sqrt(dx * dx + dy * dy) <= 10) {
  isRotating = true;
  rotateStartAngle = Math.atan2(mouseY - centerY, mouseX - centerX) - maskAngle;
  return;
}
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  if (isDragging && maskImg) {
    maskPosition.x = mouseX - dragOffset.x;
    maskPosition.y = mouseY - dragOffset.y;
    drawPFP();
  }
  if (isRotating && maskImg) {
    const centerX = maskPosition.x + maskImg.width * maskScale / 2;
    const centerY = maskPosition.y + maskImg.height * maskScale / 2;
    const angle = Math.atan2(mouseY - centerY, mouseX - centerX) - rotateStartAngle;
    maskAngle = angle;
    drawPFP();
  }
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  isRotating = false;
});

downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'my_pfp.png';
  link.href = canvas.toDataURL();
  link.click();
});
