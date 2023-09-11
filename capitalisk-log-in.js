import './capitalisk-passphrase-input.js';
import { createClient } from '../ldpos-client/module.js';

const WALLET_ADDRESS_HEX_LENGTH = 40;

class CapitaliskLogIn extends HTMLElement {
  constructor() {
    super();
    this.passphrase = '';
    this.walletAddress = '';
    this.isMultisigSupported = false;
    this.ldposClientOptions = {};
    this.disabled = false;
    this.submitButtonText = 'Log in';
    this.error = '';
    this.accountReady = false;
  }

  async connectedCallback() {
    this.disabled = this.hasAttribute('disabled');
    this.submitButtonText = this.getAttribute('submit-button-text') || this.submitButtonText;
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

  static get observedAttributes() {
    return ['disabled', 'error', 'submit-button-text'];
  }

  async attributeChangedCallback(name, oldValue, newValue) {
    if (!this.ldposClient) return;

    if (name === 'disabled') {
      this.disabled = newValue != null;
      let submitButton = this.querySelector('.submit-button');
      if (this.disabled) {
        submitButton.setAttribute('disabled', '');
      } else {
        submitButton.removeAttribute('disabled');
      }
    } else if (name === 'submit-button-text') {
      this.submitButtonText = newValue || '';
      let submitButton = this.querySelector('.submit-button');
      submitButton.setAttribute('value', this.submitButtonText);
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

  setAccountReadyState(value) {
    if (value !== this.accountReady) {
      this.accountReady = value;
      this.dispatchEvent(
        new CustomEvent('accountReadyStateChange', {
          detail: {
            accountReady: value
          }
        })
      );
    }
  }

  dispatchErrorEvent(error) {
    this.dispatchEvent(
      new CustomEvent('error', {
        detail: {
          error
        }
      })
    );
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
        <input class="submit-button" type="submit" value="${this.submitButtonText}" ${this.disabled ? 'disabled ' : ''}/>
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
          this.setAccountReadyState(false);
          multisigIndicator.innerHTML = '&#8635;';
          isFetchingAccount = true;
          let error;
          let account;
          try {
            account = await this.ldposClient.getAccount(this.walletAddress);
            multisigIndicator.innerHTML = '';
            this.setAccountReadyState(true);
          } catch (err) {
            error = err;
            multisigIndicator.classList.add('error');
            multisigIndicator.innerHTML = '!';
            account = {};
            this.setAccountReadyState(false);
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
          if (error) {
            let fetchAccountError = new Error(
              `Failed to fetch account because of error: ${error.message}`
            );
            fetchAccountError.name = 'FetchAccountError';
            this.dispatchErrorEvent(fetchAccountError);
          }
        }
      } else {
        multisigIndicator.innerHTML = '';
        multisigCheckbox.setAttribute('disabled', '');
        multisigCheckbox.checked = false;
        this.setAccountReadyState(false);
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
      let passphraseErrorMessage = passphraseInput.getAttribute('error');
      let walletAddressErrorMessage = this.walletAddress.length === this.walletAddressLength ?
        '' : 'Invalid wallet address';

      if (walletAddressErrorMessage) {
        let walletAddressError = new Error(walletAddressErrorMessage);
        walletAddressError.name = 'WalletAddressError';
        this.dispatchErrorEvent(walletAddressError);
        walletAddressInput.classList.add('error');
      }
      if (passphraseErrorMessage) {
        let passphraseError = new Error(passphraseErrorMessage);
        passphraseError.name = 'PassphraseError';
        this.dispatchErrorEvent(passphraseError);
      }
      if (walletAddressErrorMessage || passphraseErrorMessage) {
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
