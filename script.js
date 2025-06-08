// Referensi DOM
const profileInput = document.getElementById('profileInput');
const cropperImage = document.getElementById('cropperImage');
const cropperContainer = document.getElementById('cropperContainer');
const cropConfirmBtn = document.getElementById('cropConfirmBtn');
const canvas = document.getElementById('pfpCanvas');
const ctx = canvas.getContext('2d');
const maskGallery = document.getElementById('maskGallery');
const downloadBtn = document.getElementById('downloadBtn');

let cropper = null;
let profileImg = null;
let maskImg = null;
let maskPosition = { x: 0, y: 0 };
let maskAngle = 0;
let maskScale = window.innerWidth <= 768 ? 0.25 : 0.35;

// Variabel kontrol interaksi
let isDragging = false;
let isRotating = false;
let isResizing = false;
let dragOffset = { x: 0, y: 0 };
let rotateStartAngle = 0;
let lastMaskAngle = 0;
let resizeStart = { x: 0, y: 0 };
let initialMaskScale = maskScale;

// Daftar semua mask
const allMasks = [
  "mask1.png", "mask2.png", "mask3.png",
  "mask4.png", "mask5.png", "mask6.png",
  "mask7.png", "mask8.png", "mask9.png",
  "mask10.png", "mask11.png"
];
let currentIndex = 0;

function updateGallery() {
  maskGallery.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const index = (currentIndex + i) % allMasks.length;
    const img = document.createElement('img');
    img.src = allMasks[index];
    img.alt = `Mask ${index + 1}`;
    if (i === 0) img.classList.add('selected');
    maskGallery.appendChild(img);

    img.addEventListener('click', () => {
      maskGallery.querySelectorAll('img').forEach(i => i.classList.remove('selected'));
      img.classList.add('selected');
      const selectedImg = new Image();
      selectedImg.onload = () => {
        maskImg = selectedImg;
        centerMask();
        drawPFP();
      };
      selectedImg.src = img.src;
    });
  }
}

document.getElementById('prevBtn').addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + allMasks.length) % allMasks.length;
  updateGallery();
});

document.getElementById('nextBtn').addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % allMasks.length;
  updateGallery();
});

updateGallery();

// Upload Gambar
profileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    cropperImage.src = e.target.result;
    cropperContainer.style.display = 'block';
    if (cropper) cropper.destroy();
    cropper = new Cropper(cropperImage, {
      aspectRatio: 1,
      viewMode: 1,
      autoCropArea: 1,
      movable: true,
      zoomable: false,
      scalable: false,
      rotatable: false,
    });
  };
  reader.readAsDataURL(file);
});

// Konfirmasi Crop
cropConfirmBtn.addEventListener('click', () => {
  if (cropper) {
    const croppedCanvas = cropper.getCroppedCanvas({ width: 512, height: 512 });
    const img = new Image();
    img.onload = () => {
      profileImg = img;
      centerMask();
      drawPFP();
    };
    img.src = croppedCanvas.toDataURL();
    cropper.destroy();
    cropper = null;
    cropperContainer.style.display = 'none';
  }
});

// Center Mask
function centerMask() {
  if (!profileImg || !maskImg) return;
  const isMobile = window.innerWidth <= 768;
  const scale = isMobile ? 0.25 : 0.35;
  maskScale = scale;
  const scaledWidth = maskImg.width * scale;
  const scaledHeight = maskImg.height * scale;
  maskPosition.x = (canvas.width - scaledWidth) / 2;
  maskPosition.y = (canvas.height - scaledHeight) / 2;
  maskAngle = 0;
  lastMaskAngle = 0;
  drawPFP();
}

// Render ke Canvas
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
  } else {
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "24px Arial";
    ctx.fillText("No Mask/Image Selected", canvas.width / 2, canvas.height / 2);
  }
}

// Responsif Canvas
function resizeCanvas() {
  if (window.innerWidth <= 768) {
    canvas.width = 400;
    canvas.height = 400;
    maskScale = 0.25;
  } else {
    canvas.width = 512;
    canvas.height = 512;
    maskScale = 0.35;
  }
  if (maskImg) centerMask();
  else drawPFP();
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas);

// Mouse Events
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  if (!maskImg) return;

  const scaledWidth = maskImg.width * maskScale;
  const scaledHeight = maskImg.height * maskScale;
  const centerX = maskPosition.x + scaledWidth / 2;
  const centerY = maskPosition.y + scaledHeight / 2;
  const handleSize = 40;

  if (
    mouseX >= maskPosition.x + scaledWidth - handleSize &&
    mouseX <= maskPosition.x + scaledWidth &&
    mouseY >= maskPosition.y + scaledHeight - handleSize &&
    mouseY <= maskPosition.y + scaledHeight
    ) {
    isResizing = true;
  resizeStart = { x: mouseX, y: mouseY };
  initialMaskScale = maskScale;
  return;
}

const dx = mouseX - centerX;
const dy = mouseY - (centerY - scaledHeight / 2 - 20);
if (Math.sqrt(dx * dx + dy * dy) <= 10) {
  isRotating = true;
  rotateStartAngle = Math.atan2(dy, dx) - lastMaskAngle;
  return;
}

if (
  mouseX >= maskPosition.x &&
  mouseX <= maskPosition.x + maskImg.width * maskScale &&
  mouseY >= maskPosition.y &&
  mouseY <= maskPosition.y + maskImg.height * maskScale
  ) {
  isDragging = true;
dragOffset.x = mouseX - maskPosition.x;
dragOffset.y = mouseY - maskPosition.y;
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
    return;
  }

  if (isRotating && maskImg) {
    const centerX = maskPosition.x + maskImg.width * maskScale / 2;
    const centerY = maskPosition.y + maskImg.height * maskScale / 2;
    const angle = Math.atan2(mouseY - centerY, mouseX - centerX) - rotateStartAngle;
    maskAngle = angle;
    drawPFP();
    return;
  }

  if (isResizing && maskImg) {
    const dx = mouseX - resizeStart.x;
    let newScale = initialMaskScale + dx / 200;
    if (newScale >= 0.1 && newScale <= 2) {
      maskScale = newScale;
      drawPFP();
    }
  }
});

window.addEventListener('mouseup', () => {
  if (isRotating) lastMaskAngle = maskAngle;
  isDragging = false;
  isRotating = false;
  isResizing = false;
});

// Touch Events
canvas.addEventListener('touchstart', (e) => {
  const rect = canvas.getBoundingClientRect();
  if (!maskImg) return;

  if (e.touches.length === 1) {
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    const scaledWidth = maskImg.width * maskScale;
    const scaledHeight = maskImg.height * maskScale;

    if (
      touchX >= maskPosition.x &&
      touchX <= maskPosition.x + scaledWidth &&
      touchY >= maskPosition.y &&
      touchY <= maskPosition.y + scaledHeight
      ) {
      isDragging = true;
    dragOffset.x = touchX - maskPosition.x;
    dragOffset.y = touchY - maskPosition.y;
  }
}
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault(); // mencegah scroll saat drag
  if (!maskImg) return;

  if (e.touches.length === 1) {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    if (isDragging) {
      maskPosition.x = touchX - dragOffset.x;
      maskPosition.y = touchY - dragOffset.y;
      drawPFP();
    }
  }
}, { passive: false });

canvas.addEventListener('touchend', () => {
  isDragging = false;
  isRotating = false;
  isResizing = false;
});

// Tombol Download & Upload ke Firebase
downloadBtn.addEventListener('click', () => {
  if (!profileImg) {
    alert("UPLOAD YOUR PICT!");
    return;
  }
  if (!maskImg) {
    alert("ADD MASK!");
    return;
  }

  const HD_SIZE = 1024;
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = HD_SIZE;
  tempCanvas.height = HD_SIZE;

  tempCtx.drawImage(profileImg, 0, 0, HD_SIZE, HD_SIZE);

  const scaleRatio = HD_SIZE / canvas.width;
  const scaledWidth = maskImg.width * maskScale * scaleRatio;
  const scaledHeight = maskImg.height * maskScale * scaleRatio;
  const scaledX = maskPosition.x * scaleRatio;
  const scaledY = maskPosition.y * scaleRatio;
  const scaledAngle = maskAngle;

  tempCtx.save();
  tempCtx.translate(scaledX + scaledWidth / 2, scaledY + scaledHeight / 2);
  tempCtx.rotate(scaledAngle);
  tempCtx.drawImage(maskImg, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
  tempCtx.restore();

  const dataURL = tempCanvas.toDataURL('image/png');

  const link = document.createElement('a');
  link.download = 'FLAME_GANG_HD.png';
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Upload ke Firebase
  const newPostRef = database.ref('gallery').push();
  newPostRef.set({
    image: dataURL,
    timestamp: Date.now()
  }).then(() => {
    console.log("Berhasil diupload ke galeri");
  }).catch((error) => {
    console.error("Gagal upload ke galeri:", error);
  });
});

// Inisialisasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD5eY-VGogTeez_5LLge42jl7eFfH441lY",
  authDomain: "flame-pfp-gallery.firebaseapp.com",
  databaseURL: "https://flame-pfp-gallery-default-rtdb.firebaseio.com", 
  projectId: "flame-pfp-gallery",
  storageBucket: "flame-pfp-gallery.firebasestorage.app",
  messagingSenderId: "886318353088",
  appId: "1:886318353088:web:ffe6698531b7347b0bfb25"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Ambil gambar dari Firebase dan tampilkan
const galleryContainer = document.getElementById('userGallery');
let currentPage = 1;
const itemsPerPage = 8; // Number of images per page

function fetchAndDisplayImages() {
  const galleryContainer = document.getElementById('userGallery');
  galleryContainer.innerHTML = '';
  database.ref('gallery').on('value', (snapshot) => {
    const images = snapshot.val();
    if (!images) {
      galleryContainer.innerHTML = "<p>Tidak ada gambar tersedia.</p>";
      return;
    }

    const imageArray = Object.values(images).map(data => data.image);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedImages = imageArray.slice(startIndex, startIndex + itemsPerPage);

    paginatedImages.forEach(imageUrl => {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.style.width = '150px'; // Match CSS width
      img.style.height = '150px'; // Match CSS height
      img.style.objectFit = 'cover';
      img.style.borderRadius = '10px';
      img.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
      img.style.transition = 'transform 0.3s ease';
      img.style.cursor = 'pointer';

      img.addEventListener('mouseenter', () => img.style.transform = 'scale(1.1)');
      img.addEventListener('mouseleave', () => img.style.transform = 'scale(1.0)');
      galleryContainer.appendChild(img);
    });

    // Disable pagination buttons if necessary
    document.getElementById('prevPageBtn').disabled = currentPage === 1;
    document.getElementById('nextPageBtn').disabled = startIndex + paginatedImages.length >= imageArray.length;
  });
}

// Pagination Event Listeners
document.getElementById('prevPageBtn').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    fetchAndDisplayImages();
  }
});

document.getElementById('nextPageBtn').addEventListener('click', () => {
  database.ref('gallery').once('value', (snapshot) => {
    const totalImages = snapshot.numChildren();
    if ((currentPage * itemsPerPage) < totalImages) {
      currentPage++;
      fetchAndDisplayImages();
    }
  });
});

fetchAndDisplayImages();
