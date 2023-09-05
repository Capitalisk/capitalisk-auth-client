import './capitalisk-show-hide-button.js';

class CapitaliskPassphraseInput extends HTMLElement {
  connectedCallback() {
    this.show = false;
    this.passphraseInputs = [];
    this.passphrase = '';
    for (let i = 0; i < 12; i++) {
      let input = document.createElement('input');
      input.setAttribute('type', 'text');
      input.setAttribute('index', i);
      this.bindInputListeners(input);
      this.passphraseInputs.push(input);
    }
    this.render();
  }

  static get observedAttributes() {
    return ['validate'];
  }

  attributeChangedCallback() {
    this.render();
  }

  updatePassphrase() {
    this.passphrase = this.passphraseInputs.map(element => element.value).join(' ');
    this.dispatchEvent(
      new CustomEvent('passphraseChange', {
        detail: {
          passphrase: this.passphrase
        }
      })
    );
  }

  bindInputListeners(input) {
    input.addEventListener('keydown', (event) => {
      let inputIndex = parseInt(event.target.getAttribute('index'));
      if (event.keyCode === 8 && event.target.selectionStart <= 0 && event.target.selectionEnd <= 0) {
        this.passphraseInputs[Math.max(0, inputIndex - 1)].focus();
        return;
      }
      if (event.keyCode === 32) {
        event.preventDefault();
        let focusIndex = inputIndex + 1;
        if (focusIndex < 12) {
          this.passphraseInputs[focusIndex].focus();
          this.passphraseInputs[focusIndex].value = '';
        }
      }
    });
    input.addEventListener('keyup', (event) => {
      let inputIndex = parseInt(event.target.getAttribute('index'));

      let inputWords = event.target.value.split(' ');
      if (inputWords.length < 2) {
        this.updatePassphrase();
        return;
      }
      let focusOffset = 0;
      if (!inputWords[1]) {
        focusOffset = -1;
      }

      for (let i = 0; i < inputWords.length; i++) {
        let currentIndex = inputIndex + i;
        if (currentIndex < 12) {
          this.passphraseInputs[currentIndex].value = inputWords[i];
        }
      }

      let focusIndex = inputIndex + inputWords.length + focusOffset;
      if (focusIndex < 12) {
        this.passphraseInputs[focusIndex].focus();
        this.passphraseInputs[focusIndex].value = '';
      } else {
        this.passphraseInputs[11].focus();
      }
      this.updatePassphrase();
    });
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

    let hasErrors = false;

    for (let element of this.passphraseInputs) {
      element.setAttribute('type', this.show ? 'text' : 'password');
      if (validate && !element.value.length) {
        element.classList.add('error');
        hasErrors = true;
      } else {
        element.classList.remove('error');
      }
      passphraseContainer.appendChild(element);
    }

    let showHideButton = document.createElement('show-hide-button');
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
