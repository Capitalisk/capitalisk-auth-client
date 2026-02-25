import './capitalisk-show-hide-button.js';

class CapitaliskPassphraseInput extends HTMLElement {
  connectedCallback() {
    this.show = false;
    this.passphrase = '';

    this.passwordInput = document.createElement('input');
    this.passwordInput.setAttribute('type', 'password');
    this.passwordInput.classList.add('passphrase-input');
    this.passwordInput.setAttribute('placeholder', 'Enter your 12-word passphrase');
    this.passwordInput.addEventListener('input', () => {
      this.passphrase = this.passwordInput.value.trim().replace(/\s+/g, ' ');
      this.textInput.value = this.passwordInput.value;
      this.dispatchPassphraseChange();
    });

    this.textInput = document.createElement('textarea');
    this.textInput.classList.add('passphrase-input');
    this.textInput.setAttribute('rows', '3');
    this.textInput.style.resize = 'none';
    this.textInput.setAttribute('placeholder', 'Enter your 12-word passphrase');
    this.textInput.addEventListener('input', () => {
      this.passphrase = this.textInput.value.trim().replace(/\s+/g, ' ');
      this.passwordInput.value = this.textInput.value;
      this.dispatchPassphraseChange();
    });

    this.render();
  }

  static get observedAttributes() {
    return ['validate'];
  }

  attributeChangedCallback() {
    this.render();
  }

  dispatchPassphraseChange() {
    this.dispatchEvent(
      new CustomEvent('passphraseChange', {
        detail: {
          passphrase: this.passphrase
        }
      })
    );
  }

  bindShowHideListeners(showhideButton) {
    showhideButton.addEventListener('click', () => {
      this.show = !this.show;
      showhideButton.setAttribute('show', this.show);
      this.render();
    });
  }

  render() {
    let validate = this.getAttribute('validate') === 'true';
    this.innerHTML = ``;

    let passphraseContainer = document.createElement('div');
    passphraseContainer.classList.add('passphrase-container');

    let activeInput = this.show ? this.textInput : this.passwordInput;

    let hasErrors = false;
    if (validate && !activeInput.value.trim().length) {
      activeInput.classList.add('error');
      hasErrors = true;
    } else {
      activeInput.classList.remove('error');
    }

    passphraseContainer.appendChild(activeInput);

    let showHideButton = document.createElement('capitalisk-show-hide-button');
    showHideButton.classList.add('passphrase-show-hide-button');
    showHideButton.setAttribute('show', this.show);

    this.bindShowHideListeners(showHideButton);

    this.appendChild(showHideButton);
    this.appendChild(passphraseContainer);

    if (hasErrors) {
      this.setAttribute('error', 'Some passphrase inputs were invalid');
    } else {
      this.removeAttribute('error');
    }
  }
}

window.customElements.define('capitalisk-passphrase-input', CapitaliskPassphraseInput);
