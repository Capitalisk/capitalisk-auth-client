class ShowHideButton extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['show'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.render();
  }

  render() {
    let show = this.getAttribute('show') === 'true';
    if (show) {
      this.innerHTML = `<a href="javascript: void(0);">Hide</a>`;
      return;
    }
    this.innerHTML = `<a href="javascript: void(0);">Show</a>`;
  }
}

window.customElements.define('show-hide-button', ShowHideButton);
