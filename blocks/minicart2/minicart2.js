class MiniCart {
  /**
   * @type {{
   *  guest: boolean,
   *  cartId: string | undefined
   * } | undefined}
   */
  customer;

  /**
   * @type {{
   *  sku: string,
   *  thumbnail: string | undefined,
   *  name: string,
   *  quantity: number,
   *  lineSubtotal: number,
   *  bundledProducts:
   *    {
   *      label: 'Machine',
   *      name: 'Test Product 1',
   *      quantity: 1,
   *    }[],
   * }[]}
   */
  items = [];

  /**
   * @type {{
   *   quantity: number;
   *   subtotal: number;
   * }}
   */
  totals = {
  };

  /**
   * @type {boolean}
   */
  active = false;

  /**
   * @type {boolean}
   */
  loading = false;

  /**
   * @type {HTMLDivElement}
   */
  htmlContainer;

  /**
   * @type {WindowSessionStorage | WindowLocalStorage}
   */
  storage;

  // TODO: move external, formalize how these configs are populated
  /**
   * @type {string}
   */
  endpoint = 'https://magento2.docker/graphql';

  MAGENTO_CREATE_GUEST_CART_MUTATION = `#graphql
    mutation
    {
    createEmptyCart
    }
    `;

  MINICART_FRAGMENT = `#graphql
  fragment Cart on Cart {
    
            items {
            quantity
            prices {
                row_total {
                    value
                    currency
                }
            }
            product {
                sku
                name
                thumbnail {
        url
        label
      }
                image {
                    url
                }
            }
        }
        total_quantity
        prices {
            subtotal_excluding_tax {
                currency
                value
            }
        }
    }
  
  `;

  CART_QUERY = `#graphql
    query Cart($cartId: String!)
    {
            cart(cart_id: $cartId) {
                ...Cart
            }
        
        }
        ${this.MINICART_FRAGMENT}
    `;

  CUSTOMER_CART_QUERY = `#graphql
    query CustomerCart()
    {
            customerCart {
                ...Cart
            }
        
        }
        ${this.MINICART_FRAGMENT}
    `;

  /**
   * A wild constructor appears.
   *
   * @param options for the minicart
   * @param options.storage where state is persisted (likely session or local storage)
   * @param options.htmlContainer where the minicart should be rendered
   */
  constructor(options) {
    this.storage = options.storage;
    this.htmlContainer = options.htmlContainer;
    this.htmlContainer.id = 'minicart';

    // setup any DOM event listeners
    this.addEventListeners();
  }

  get totalQuantity() {
    return this.items.reduce(
      (accumulator, item) => item.quantity + accumulator,
      0,
    );
  }

  get cartSubtotal() {
    return this.items.reduce(
      (accumulator, item) => item.lineSubtotal + accumulator,
      0,
    );
  }

  async setupCart() {
    // check if there is a cart at all and if not create one if needed for a guest

    // if the customer is logged in we'll fetch their cart, they should always have one
    // TODO: confirm after a quote is converted to an order a new cart is
    if (this.storage.getItem('token')) {
      // todo: create customer cart if needed but may not be required

    }
    //  created automatically and we don't need to do it - there is a chance this will return null
    // if the customer is not logged in then we'll check to see if there is a cart in the browser

    const cartId = this.storage.getItem('cartId');
    if (!cartId) {
      const result = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // eslint-disable-next-line no-use-before-define
          query: this.MAGENTO_CREATE_GUEST_CART_MUTATION,
        }),
      });

      const jsonData = await result.json();
      this.storage.setItem('cartId', jsonData?.data?.createEmptyCart);
    }

    return null;
  }

  addEventListeners() {
    this.htmlContainer.addEventListener('minicart-update', async (event) => {
      this.active = true;
      await this.update();
    });
    this.htmlContainer.addEventListener('click', (event) => {
      if (event.target.closest('#minicart-button')) {
        this.active = !this.active;
        this.render();
      }
    });
  }

  render() {
    if (this.active) {
      this.htmlContainer.classList.add('active');
    } else {
      this.htmlContainer.classList.remove('active');
    }
    if (this.loading) {
      this.htmlContainer.classList.add('loading');
    } else {
      this.htmlContainer.classList.remove('loading');
    }

    this.htmlContainer.innerHTML = `
        <button id="minicart-button">
            <svg viewBox="0 0 35 35">
                <g>
                    <defs>
                        <linearGradient id="bottom-to-top">
                            <stop offset="0" stop-color="#4DAF4C">
                                <animate dur="2s" attributeName="st0" fill="freeze" from="0" to="1"></animate>
                            </stop>
                            <stop offset="0" stop-color="#fff">
                                <animate dur="2s" attributeName="st0" fill="freeze" from="0" to="1"></animate>
                            </stop>

                        </linearGradient>
                    </defs>
                    <polygon id="polygon" points="8,8.9 5.7,26.7 6.3,28.4 7.9,29.3 26.2,29.3 28.5,28.4 29,26.4 26.8,8.9"></polygon>
                    <path class="st1" d="M21.4,13V6c0-2.4-1.9-4.3-4.1-4.3s-4.1,2-4.1,4.3v7c0,0.5-0.4,0.8-0.8,0.8c-0.5,0-0.8-0.4-0.8-0.8V6 
                    c0-3.4,2.6-6,5.7-6S23,2.6,23,6v7c0,0.5-0.4,0.8-0.8,0.8C21.8,13.8,21.4,13.5,21.4,13z"></path>
                    <path class="st1" d="M8.3,9.7l-2,16.7c-0.1,0.5,0.1,1.1,0.5,1.5c0.4,0.4,1,0.6,1.6,0.6h17.8c0.6,0,1.2-0.2,1.6-0.6
                    c0.4-0.4,0.6-0.9,0.5-1.5L26.4,9.7H8.3z M8.4,30c-1.1,0-2.1-0.4-2.9-1.2c-0.8-0.8-1.1-1.7-1-2.7l2-17.4c0-0.4,0.4-0.7,0.9-0.7H27
                    c0.5,0,0.8,0.3,0.9,0.7l2,17.4c0.1,1-0.2,2-1,2.7c-0.7,0.7-1.8,1.2-2.9,1.2H8.4z"></path>
                </g>
            </svg>
            <span>${this.totals.quantity || ''}</span>
        </button>
        <div class="minicart-items" role="dialog">
            <div class="minicart-toast"></div>
            <ul>
            ${this.items
    .map(
      (item) => `
                    <li>
                        <img src="${item.thumbnail}" alt="${item.name}" />
                        <div>
                            <span>${
  item.quantity > 2 ? `${item.quantity} x ` : ''
}${item.name}</span>
                            <strong>${item.lineSubtotal.toLocaleString(
    'fr-FR',
    { style: 'currency', currency: 'EUR' },
  )}</strong>
                        </div>

                    </li>
                `,
    )
    .join('')}
            </ul>
            <div class="minicart-totals">
                <span>${this.totalQuantity}${
  this.totalQuantity > 1 ? ' items' : ' item'
} in your bag</span>
                <span>subtotal: <strong>${this.cartSubtotal.toLocaleString(
    'fr-FR',
    { style: 'currency', currency: 'EUR' },
  )}</strong></span>
            </div>
            <div class="minicart-buttons">
                <button>
                    go to cart
                    </button>
                    <button>
                    checkout
                    </button>
            </div>
        </div>
    `;
  }

  async update() {
    this.loading = true;
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 2000);
    });
    const result = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // eslint-disable-next-line no-use-before-define
        query: this.CART_QUERY,
        variables: {
          cartId: this.storage.getItem('cartId'),
        },
      }),
    });
    const jsonData = await result.json();
    console.log(jsonData);

    const jsonCartData = jsonData?.data?.cart || jsonData?.data?.customerCart;
    // TODO: be defensive here, lots could go wrong, we should record sad paths
    if (!jsonCartData) {
      console.error('unable to retrieve cart');
    }

    this.totals = {
      subtotal: jsonCartData.prices.subtotal_excluding_tax.value,
      quantity: jsonCartData.total_quantity,
    };

    this.items = jsonCartData.items.map((item) => ({
      sku: item.sku,
      quantity: item.quantity,
      name: item.product.name,
      thumbnail: item.product.thumbnail.url,
      lineSubtotal: item.prices.row_total.value,
      bundledProducts: [],
    }));
    this.loading = false;
    this.render();
  }

  loadState() {
    // TODO: load the state from `storage`
    this.customer = {
      guest: true,
      cartId: 'adsf',
    };
  }
}

export default async function decorate(block) {
  const minicartContainer = document.createElement('div');
  const minicart = new MiniCart({
    storage: sessionStorage,
    htmlContainer: minicartContainer,
  });

  block.textContent = '';
  block.append(minicartContainer);

  // this is where the minicart does any initial cart setup work it is responsible for
  await minicart.setupCart();
  // load the state
  minicart.update();
  minicart.render();
}
