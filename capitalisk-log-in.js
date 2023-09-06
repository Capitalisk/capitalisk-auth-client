import './capitalisk-passphrase-input.js';
import { createClient } from './node_modules/ldpos-client/module.js';

const WALLET_ADDRESS_HEX_LENGTH = 40;

class CapitaliskLogIn extends HTMLElement {
  constructor() {
    super();
    this.passphrase = '';
    this.walletAddress = '';
    this.isMultisigSupported = false;
    this.ldposClientOptions = {};
    this.loading = false;
    this.error = '';
  }

  static get observedAttributes() {
    return ['loading', 'error'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'loading') {
      this.loading = newValue != null;
      let submitButton = this.querySelector('.submit-button');
      if (this.loading) {
        submitButton.value = 'Loading...';
        submitButton.setAttribute('disabled', '');
      } else {
        submitButton.value = 'Log in';
        submitButton.removeAttribute('disabled');
      }
    } else if (name === 'error') {
      this.error = newValue || '';
      let errorArea = this.querySelector('.error-area');
      errorArea.textContent = this.error;
      if (this.error) {
        errorArea.classList.add('error');
      } else {
        errorArea.classList.remove('error');
      }
    }
  }

  async connectedCallback() {
    this.loading = this.hasAttribute('loading');
    this.error = this.getAttribute('error') || '';
    this.ldposClientOptions.hostname = this.getAttribute('hostname');
    this.ldposClientOptions.port = Number(this.getAttribute('port'));
    this.ldposClientOptions.networkSymbol = this.getAttribute('network-symbol');
    this.ldposClientOptions.chainModuleName = this.getAttribute('chain-module-name');
    this.ldposClientOptions.secure = this.getAttribute('secure') === 'true';
    if (this.ldposClientOptions.networkSymbol) {
      this.walletAddressLength = this.ldposClientOptions.networkSymbol.length + WALLET_ADDRESS_HEX_LENGTH;
    } else {
      this.walletAddressLength = 0;
    }
    this.ldposClient = createClient(this.ldposClientOptions);
    this.render();
  }

  render() {
    this.innerHTML = `
      <form class="log-in-form">
        <h2>
          Log in via
          <a
            href="${this.ldposClientOptions.secure ? 'https://' : 'http://'}${this.ldposClientOptions.hostname}"
            target="_blank"
          >${this.ldposClientOptions.hostname}</a>
        </h2>
        <input class="wallet-address-input long-input" type="text" placeholder="Wallet address" />
        <div class="form-panel">
          <label for="is-multisig">Multisig:</label> <input id="is-multisig" type="checkbox" disabled /> <span class="multisig-indicator"></span>
        </div>
        <capitalisk-passphrase-input></capitalisk-passphrase-input>
        <div class="error-area${this.error ? ' error' : ''}">${this.error}</div>
        <input class="submit-button" type="submit" value="${this.loading ? 'Loading...' : 'Log in'}" ${this.loading ? 'disabled ' : ''}/>
      </form>
    `;

    let walletAddressInput = this.querySelector('.wallet-address-input');
    let multisigCheckbox = this.querySelector('#is-multisig');
    let multisigIndicator = this.querySelector('.multisig-indicator');
    let errorArea = this.querySelector('.error-area');

    let isFetchingAccount = false;

    walletAddressInput.addEventListener('keyup', async (event) => {
      this.walletAddress = event.target.value;
      if (this.walletAddress.length >= this.walletAddressLength) {
        multisigIndicator.classList.remove('error');
        if (!isFetchingAccount) {
          multisigIndicator.classList.add('spinning');
          multisigIndicator.innerHTML = '&#8635;';
          isFetchingAccount = true;
          let account;
          try {
            account = await this.ldposClient.getAccount(this.walletAddress);
            multisigIndicator.innerHTML = '';
          } catch (error) {
            console.error(
              new Error(
                `Failed to fetch account because of error: ${error.message}`
              )
            );
            multisigIndicator.classList.add('error');
            multisigIndicator.innerHTML = '!';
            account = {};
          }
          isFetchingAccount = false;
          multisigIndicator.classList.remove('spinning');
          this.isMultisigSupported = !!account.multisigPublicKey;
          if (this.isMultisigSupported) {
            multisigCheckbox.removeAttribute('disabled');
            multisigCheckbox.checked = true;
          } else {
            multisigCheckbox.setAttribute('disabled', '');
            multisigCheckbox.checked = false;
          }
        }
      } else {
        multisigIndicator.innerHTML = '';
        multisigCheckbox.setAttribute('disabled', '');
        multisigCheckbox.checked = false;
      }
    });

    let passphraseInput = this.querySelector('capitalisk-passphrase-input');
    passphraseInput.addEventListener('passphraseChange', (event) => {
      this.passphrase = event.detail.passphrase;
    });

    let form = this.querySelector('.log-in-form');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorArea.textContent = '';

      walletAddressInput.classList.remove('error');
      passphraseInput.setAttribute('validate', true);
      let passphraseError = passphraseInput.getAttribute('error');
      let walletAddressError = this.walletAddress.length === this.walletAddressLength ?
        '' : 'Invalid wallet address';

      if (walletAddressError) {
        console.error(walletAddressError);
        walletAddressInput.classList.add('error');
      }
      if (passphraseError) {
        console.error(passphraseError);
      }
      if (walletAddressError || passphraseError) {
        return;
      }

      let walletAddress = this.walletAddress ? this.walletAddress.trim() : null;
      let keyType = multisigCheckbox.checked ? 'multisig' : 'sig';

      this.dispatchEvent(
        new CustomEvent('submitCredentials', {
          detail: {
            type: keyType,
            passphrase: this.passphrase,
            walletAddress
          }
        })
      );
    });
  }
}

window.customElements.define('capitalisk-log-in', CapitaliskLogIn);

export default CapitaliskLogIn;
