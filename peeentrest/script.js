document.addEventListener('DOMContentLoaded', () => {
  const board = document.getElementById('board');
  const uploadForm = document.getElementById('uploadForm');
  const imageInput = document.getElementById('imageInput');
  const descriptionInput = document.getElementById('descriptionInput');
  const exportSelectedBtn = document.getElementById('exportSelectedBtn');
  const batchExportBtn = document.getElementById('batchExportBtn');
  const importZipInput = document.getElementById('importZipInput');

  // Shopping cart and checkout elements
  const shoppingCartSection = document.getElementById('shoppingCartSection');
  const cartItemsContainer = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const checkoutModal = document.getElementById('checkoutModal');
  const stripePayBtn = document.getElementById('stripePayBtn');
  const paypalPayBtn = document.getElementById('paypalPayBtn');
  const stripePaymentForm = document.getElementById('stripePaymentForm');
  const stripeForm = document.getElementById('stripeForm');
  const closeCheckoutModalBtn = document.getElementById('closeCheckoutModal');

  const STORAGE_KEY = 'pinterestCloneBoard';
  const CART_STORAGE_KEY = 'pinterestCloneCart';

  let cardsData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  let cartData = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];

  // Stripe public key (replace with your own)
  const STRIPE_PUBLIC_KEY = 'pk_test_XXXXXXXXXXXXXXXXXXXXXXXX';

  // Initialize Stripe
  const stripe = Stripe(STRIPE_PUBLIC_KEY);
  const elements = stripe.elements();
  const cardElement = elements.create('card');
  cardElement.mount('#card-element');

  // Render the personal board with images and add to cart buttons
  function renderBoard() {
    board.innerHTML = '';
    cardsData.forEach((card, index) => {
      const cardEl = createCardElement(card, index);
      board.appendChild(cardEl);
    });
    addDragAndDropListeners();
  }

  // Create a card element with checkbox, description editing, and add to cart button
  function createCardElement(card, index) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'bg-white rounded-lg shadow-md overflow-hidden cursor-move relative';
    cardDiv.setAttribute('draggable', 'true');
    cardDiv.dataset.index = index;

    // Checkbox for selection
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'absolute top-2 left-2 w-5 h-5 z-10';
    checkbox.dataset.index = index;

    const img = document.createElement('img');
    img.src = card.image;
    img.alt = card.description;
    img.className = 'w-full h-48 object-cover';

    // Description container
    const descContainer = document.createElement('div');
    descContainer.className = 'p-3 relative';

    const desc = document.createElement('p');
    desc.textContent = card.description;
    desc.className = 'text-gray-700 text-sm pr-6';

    // Auto-generated indicator
    if (card.source === 'auto') {
      const autoIcon = document.createElement('span');
      autoIcon.innerHTML = '🤖';
      autoIcon.title = 'Auto-generated description';
      autoIcon.className = 'absolute top-3 right-3 text-xs cursor-help';
      descContainer.appendChild(autoIcon);

      // Make description editable for auto-generated ones
      desc.contentEditable = true;
      desc.className += ' hover:bg-gray-50 focus:bg-gray-50 focus:outline-none rounded px-1';
      desc.addEventListener('blur', () => {
        const newDesc = desc.textContent.trim();
        if (newDesc && newDesc !== card.description) {
          cardsData[index].description = newDesc;
          cardsData[index].source = 'user';
          saveToStorage();
          renderBoard();
        }
      });
    }

    descContainer.appendChild(desc);

    // Add to Cart button
    const addToCartBtn = document.createElement('button');
    addToCartBtn.textContent = 'Add to Cart';
    addToCartBtn.className = 'absolute bottom-2 right-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition text-sm';
    addToCartBtn.addEventListener('click', () => {
      addToCart(index);
    });

    cardDiv.appendChild(checkbox);
    cardDiv.appendChild(img);
    cardDiv.appendChild(descContainer);
    cardDiv.appendChild(addToCartBtn);

    return cardDiv;
  }

  // Save cards data to localStorage
  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cardsData));
  }

  // Save cart data to localStorage
  function saveCartToStorage() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
  }

  // Add item to cart with quantity management
  function addToCart(index) {
    const item = cardsData[index];
    const existingItemIndex = cartData.findIndex(c => c.image === item.image);
    const price = 1000; // in cents

    if (existingItemIndex === -1) {
      cartData.push({ ...item, price, quantity: 1 });
    } else {
      cartData[existingItemIndex].quantity += 1;
    }
    saveCartToStorage();
    renderCart();
    alert('Item added to cart');
  }

  // Remove item from cart
  function removeFromCart(index) {
    cartData.splice(index, 1);
    saveCartToStorage();
    renderCart();
  }

  // Update item quantity in cart
  function updateQuantity(index, newQuantity) {
    if (newQuantity < 1) return;
    cartData[index].quantity = newQuantity;
    saveCartToStorage();
    renderCart();
  }

  // Render shopping cart items with quantity controls
  function renderCart() {
    cartItemsContainer.innerHTML = '';
    if (cartData.length === 0) {
      cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
      cartTotalEl.textContent = '0.00';
      return;
    }
    let total = 0;
    cartData.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'flex items-center justify-between mb-2 space-x-4';

      const desc = document.createElement('p');
      desc.textContent = item.description;
      desc.className = 'text-gray-700 flex-1';

      const quantityInput = document.createElement('input');
      quantityInput.type = 'number';
      quantityInput.min = '1';
      quantityInput.value = item.quantity;
      quantityInput.className = 'w-16 text-center border rounded px-2 py-1';
      quantityInput.addEventListener('change', (e) => {
        const val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) {
          e.target.value = item.quantity;
          return;
        }
        updateQuantity(index, val);
      });

      const price = document.createElement('p');
      price.textContent = `$${((item.price * item.quantity) / 100).toFixed(2)}`;
      price.className = 'text-gray-900 font-semibold w-20 text-right';

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.className = 'text-red-600 hover:text-red-800 ml-4';
      removeBtn.addEventListener('click', () => {
        removeFromCart(index);
      });

      itemDiv.appendChild(desc);
      itemDiv.appendChild(quantityInput);
      itemDiv.appendChild(price);
      itemDiv.appendChild(removeBtn);

      cartItemsContainer.appendChild(itemDiv);

      total += item.price * item.quantity;
    });
    cartTotalEl.textContent = (total / 100).toFixed(2);
  }

  // Show checkout modal
  function showCheckoutModal() {
    checkoutModal.classList.remove('hidden');
    stripePaymentForm.classList.add('hidden');
    paymentMethod = null;
  }

  // Hide checkout modal
  function hideCheckoutModal() {
    checkoutModal.classList.add('hidden');
    clearStripeErrors();
  }

  // Clear Stripe errors
  function clearStripeErrors() {
    const errorElement = document.getElementById('card-errors');
    if (errorElement) errorElement.textContent = '';
  }

  // Handle Stripe payment
  async function handleStripePayment(event) {
    event.preventDefault();
    if (cartData.length === 0) {
      alert('Your cart is empty.');
      return;
    }
    checkoutBtn.disabled = true;

    // Calculate total amount in cents
    const amount = cartData.reduce((sum, item) => sum + item.price, 0);

    try {
      // Create payment intent on backend
      const response = await fetch('http://localhost:3000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: 'usd' }),
      });
      const data = await response.json();
      const clientSecret = data.clientSecret;

      // Confirm card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        alert(result.error.message);
        checkoutBtn.disabled = false;
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          alert('Payment successful! Thank you for your purchase.');
          cartData = [];
          saveCartToStorage();
          renderCart();
          hideCheckoutModal();
          checkoutBtn.disabled = false;
        }
      }
    } catch (error) {
      alert('Payment failed. Please try again.');
      checkoutBtn.disabled = false;
    }
  }

  // Handle PayPal payment
  async function handlePayPalPayment() {
    if (cartData.length === 0) {
      alert('Your cart is empty.');
      return;
    }
    // Calculate total amount in cents
    const amount = cartData.reduce((sum, item) => sum + item.price, 0);

    try {
      // Create PayPal order on backend
      const response = await fetch('http://localhost:3000/api/create-paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: 'USD' }),
      });
      const data = await response.json();
      const orderID = data.id;

      // Render PayPal Buttons
      paypal.Buttons({
        createOrder: (data, actions) => {
          return orderID;
        },
        onApprove: async (data, actions) => {
          // Capture order on backend
          const captureResponse = await fetch('http://localhost:3000/api/capture-paypal-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderID: data.orderID }),
          });
          const captureData = await captureResponse.json();
          alert('Payment successful! Thank you for your purchase.');
          cartData = [];
          saveCartToStorage();
          renderCart();
          hideCheckoutModal();
        },
        onError: (err) => {
          alert('PayPal payment failed. Please try again.');
        },
      }).render('#paypalPayBtn');
    } catch (error) {
      alert('PayPal payment failed. Please try again.');
    }
  }

  // Event listeners
  // Function to extract metadata from image
  async function getImageMetadata(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const view = new DataView(e.target.result);
          const metadata = {
            description: '',
            dateCreated: '',
            cameraModel: '',
            source: 'exif'
          };

          // Check if it's a JPEG file
          if (view.getUint16(0, false) !== 0xFFD8) {
            console.log('Not a JPEG file, skipping EXIF extraction');
            resolve(metadata);
            return;
          }

          let offset = 2;
          while (offset < view.byteLength) {
            // Look for EXIF marker (0xFFE1)
            if (view.getUint16(offset, false) === 0xFFE1) {
              const exifLength = view.getUint16(offset + 2, false);
              const exifData = new Uint8Array(e.target.result.slice(offset + 4, offset + 2 + exifLength));
              const exifText = new TextDecoder().decode(exifData);
              
              // Extract various EXIF fields
              const descMatch = exifText.match(/Description:\s*([^\n]+)/i);
              const dateMatch = exifText.match(/DateTime:\s*([^\n]+)/i);
              const cameraMatch = exifText.match(/Model:\s*([^\n]+)/i);

              if (descMatch) metadata.description = descMatch[1].trim();
              if (dateMatch) metadata.dateCreated = dateMatch[1].trim();
              if (cameraMatch) metadata.cameraModel = cameraMatch[1].trim();
              
              break;
            }
            offset += 2;
          }

          console.log('Extracted metadata:', metadata);
          resolve(metadata);
        } catch (err) {
          console.warn('Error reading image metadata:', err);
          resolve({ description: '', dateCreated: '', cameraModel: '', source: 'error' });
        }
      };
      reader.onerror = function() {
        console.warn('Error reading file:', reader.error);
        resolve({ description: '', dateCreated: '', cameraModel: '', source: 'error' });
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // Function to generate AI description based on metadata
  function generateDescription(file, metadata) {
    // This would be replaced with actual AI service call
    const date = metadata.dateCreated || new Date().toLocaleDateString();
    const camera = metadata.cameraModel ? ` with ${metadata.cameraModel}` : '';
    return `Beautiful moment captured on ${date}${camera}`;
  }

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = imageInput.files[0];
    if (!file) {
      alert('Please select an image to upload');
      return;
    }

    try {
      // Get user-provided description or empty string
      let description = descriptionInput.value.trim();
      let metadata = { source: 'user' };

      // If no description provided, try to get metadata from image
      if (!description) {
        console.log('No description provided, extracting metadata...');
        metadata = await getImageMetadata(file);
        
        if (metadata.description) {
          console.log('Using EXIF description');
          description = metadata.description;
        } else {
          console.log('Generating AI description from metadata');
          description = generateDescription(file, metadata);
          metadata.source = 'ai';
        }
      }

      // Read image as base64
      const reader = new FileReader();
      reader.onload = function(event) {
        const base64Image = event.target.result;
        
        // Store image with metadata
        cardsData.push({ 
          image: base64Image, 
          description,
          dateCreated: metadata.dateCreated || new Date().toISOString(),
          cameraModel: metadata.cameraModel || '',
          source: metadata.source
        });

        saveToStorage();
        renderBoard();
        uploadForm.reset();

        // Show feedback based on description source
        const sourceText = metadata.source === 'user' ? 'user-provided' :
                         metadata.source === 'exif' ? 'extracted from image' :
                         'generated by AI';
        console.log(`Image uploaded successfully with ${sourceText} description`);
      };

      reader.onerror = function() {
        throw new Error('Failed to read image file');
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  });

  exportSelectedBtn.addEventListener('click', async () => {
    const selectedIndexes = Array.from(board.querySelectorAll('input[type="checkbox"]:checked')).map(cb => parseInt(cb.dataset.index));
    if (selectedIndexes.length === 0) {
      alert('Please select at least one photo to export.');
      return;
    }
    await exportPhotos(selectedIndexes);
  });

  batchExportBtn.addEventListener('click', async () => {
    if (cardsData.length === 0) {
      alert('No photos to export.');
      return;
    }
    await exportPhotos(cardsData.map((_, idx) => idx));
  });

  importZipInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const zip = new JSZip();
    try {
      const content = await zip.loadAsync(file);
      const newCards = [];

      let descriptions = {};
      if (content.files['descriptions.txt']) {
        const descText = await content.files['descriptions.txt'].async('string');
        descText.split('\n').forEach(line => {
          const [filename, ...descParts] = line.split(':');
          if (filename && descParts.length > 0) {
            descriptions[filename.trim()] = descParts.join(':').trim();
          }
        });
      }

      for (const filename in content.files) {
        if (filename === 'descriptions.txt') continue;
        const fileData = await content.files[filename].async('base64');
        const ext = filename.split('.').pop().toLowerCase();
        const mimeType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/*';
        const base64Image = `data:${mimeType};base64,${fileData}`;
        const description = descriptions[filename] || '';
        newCards.push({ image: base64Image, description });
      }

      cardsData = cardsData.concat(newCards);
      saveToStorage();
      renderBoard();
      importZipInput.value = '';
      alert('Import successful!');
    } catch (err) {
      alert('Failed to import ZIP file. Please ensure it is a valid ZIP with photos and descriptions.');
    }
  });

  // Drag and Drop handlers
  let dragSrcEl = null;

  function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
    this.classList.add('opacity-50');
  }

  function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
  }

  function handleDragEnter() {
    this.classList.add('border-4', 'border-pink-600');
  }

  function handleDragLeave() {
    this.classList.remove('border-4', 'border-pink-600');
  }

  function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (dragSrcEl !== this) {
      const fromIndex = parseInt(dragSrcEl.dataset.index);
      const toIndex = parseInt(this.dataset.index);
      const movedItem = cardsData.splice(fromIndex, 1)[0];
      cardsData.splice(toIndex, 0, movedItem);
      saveToStorage();
      renderBoard();
    }
    return false;
  }

  function handleDragEnd() {
    this.classList.remove('opacity-50');
    const cards = board.querySelectorAll('div[draggable="true"]');
    cards.forEach(card => card.classList.remove('border-4', 'border-pink-600'));
  }

  function addDragAndDropListeners() {
    const cards = board.querySelectorAll('div[draggable="true"]');
    cards.forEach(card => {
      card.addEventListener('dragstart', handleDragStart);
      card.addEventListener('dragenter', handleDragEnter);
      card.addEventListener('dragover', handleDragOver);
      card.addEventListener('dragleave', handleDragLeave);
      card.addEventListener('drop', handleDrop);
      card.addEventListener('dragend', handleDragEnd);
    });
  }

  // Export photos helper
  async function exportPhotos(indexes) {
    const zip = new JSZip();
    const descLines = [];

    for (const i of indexes) {
      const card = cardsData[i];
      const base64Data = card.image.split(',')[1];
      const ext = card.image.substring("data:image/".length, card.image.indexOf(";base64"));
      const filename = `photo_${i + 1}.${ext}`;
      zip.file(filename, base64Data, { base64: true });
      descLines.push(`${filename}: ${card.description}`);
    }

    zip.file('descriptions.txt', descLines.join('\n'));

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'photos.zip';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Initial render
  renderBoard();
  renderCart();

  // Render shopping cart items
  function renderCart() {
    cartItemsContainer.innerHTML = '';
    if (cartData.length === 0) {
      cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
      cartTotalEl.textContent = '0.00';
      return;
    }
    let total = 0;
    cartData.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'flex items-center justify-between mb-2';

      const desc = document.createElement('p');
      desc.textContent = item.description;
      desc.className = 'text-gray-700';

      const price = document.createElement('p');
      price.textContent = `$${(item.price / 100).toFixed(2)}`;
      price.className = 'text-gray-900 font-semibold';

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.className = 'text-red-600 hover:text-red-800 ml-4';
      removeBtn.addEventListener('click', () => {
        removeFromCart(index);
      });

      itemDiv.appendChild(desc);
      itemDiv.appendChild(price);
      itemDiv.appendChild(removeBtn);

      cartItemsContainer.appendChild(itemDiv);

      total += item.price;
    });
    cartTotalEl.textContent = (total / 100).toFixed(2);
  }

  // Remove item from cart
  function removeFromCart(index) {
    cartData.splice(index, 1);
    saveCartToStorage();
    renderCart();
  }

  // Show checkout modal
  function showCheckoutModal() {
    checkoutModal.classList.remove('hidden');
    stripePaymentForm.classList.add('hidden');
    paymentMethod = null;
  }

  // Hide checkout modal
  function hideCheckoutModal() {
    checkoutModal.classList.add('hidden');
    clearStripeErrors();
  }

  // Clear Stripe errors
  function clearStripeErrors() {
    const errorElement = document.getElementById('card-errors');
    if (errorElement) errorElement.textContent = '';
  }

  // Payment method state
  let paymentMethod = null;

  // Event listeners for checkout modal buttons
  checkoutBtn.addEventListener('click', () => {
    if (cartData.length === 0) {
      alert('Your cart is empty.');
      return;
    }
    showCheckoutModal();
  });

  closeCheckoutModalBtn.addEventListener('click', () => {
    hideCheckoutModal();
  });

  stripePayBtn.addEventListener('click', () => {
    paymentMethod = 'stripe';
    stripePaymentForm.classList.remove('hidden');
  });

  paypalPayBtn.addEventListener('click', () => {
    paymentMethod = 'paypal';
    stripePaymentForm.classList.add('hidden');
    // Render PayPal Buttons dynamically
    renderPayPalButtons();
  });

  // Handle Stripe payment form submission
  stripeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (paymentMethod !== 'stripe') return;

    checkoutBtn.disabled = true;

    const amount = cartData.reduce((sum, item) => sum + item.price, 0);

    try {
      const response = await fetch('http://localhost:3000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: 'usd' }),
      });
      const data = await response.json();
      const clientSecret = data.clientSecret;

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        alert(result.error.message);
        checkoutBtn.disabled = false;
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          alert('Payment successful! Thank you for your purchase.');
          cartData = [];
          saveCartToStorage();
          renderCart();
          hideCheckoutModal();
          checkoutBtn.disabled = false;
        }
      }
    } catch (error) {
      alert('Payment failed. Please try again.');
      checkoutBtn.disabled = false;
    }
  });

  // Render PayPal Buttons
  function renderPayPalButtons() {
    // Clear previous buttons if any
    const paypalContainer = document.getElementById('paypalPayBtn');
    paypalContainer.innerHTML = '';

    paypal.Buttons({
      createOrder: (data, actions) => {
        const amount = cartData.reduce((sum, item) => sum + item.price, 0);
        return fetch('http://localhost:3000/api/create-paypal-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency: 'USD' }),
        })
          .then(res => res.json())
          .then(data => data.id);
      },
      onApprove: (data, actions) => {
        return fetch('http://localhost:3000/api/capture-paypal-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderID: data.orderID }),
        })
          .then(res => res.json())
          .then(details => {
            alert('Payment successful! Thank you for your purchase.');
            cartData = [];
            saveCartToStorage();
            renderCart();
            hideCheckoutModal();
          });
      },
      onError: (err) => {
        alert('PayPal payment failed. Please try again.');
      },
    }).render('#paypalPayBtn');
  }

  // Initial render calls
  renderBoard();
  renderCart();
});
