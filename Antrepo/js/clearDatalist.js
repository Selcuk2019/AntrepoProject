// File: clearDatalist.js
export function initDatalistClear(selector = '.datalist-container') {
    const containers = document.querySelectorAll(selector);
    containers.forEach(container => {
      const input = container.querySelector('input[list]');
      const clearBtn = container.querySelector('.clear-datalist');
      if (input && clearBtn) {
        clearBtn.addEventListener('click', () => {
          input.value = "";
          // İsterseniz input değiştiğinde tetiklenen event'ı da manuel olarak tetikleyin:
          input.dispatchEvent(new Event('change'));
        });
      }
    });
  }
  