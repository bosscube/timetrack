(async () => {
    const { $, $$, formatTime, loadSettings, saveSettings, serializeForm, slug, toast } = window.helpers;
    const windowsEl = $('#windows');
    const lens = $('.lens');
    const settings = await loadSettings();

    electronAPI.updateSettings(settings);

    // Settings
    $('#open-settings').addEventListener('click', e => {
        e.preventDefault();
        $('#settings').classList.add('show');
    });

    // Dialog lens
    lens.addEventListener('click', e => {
        $$('.dialog.show').forEach(dialog => {
            dialog.classList.remove('show');
        });
    });

    // Delegated bindings
    windowsEl.addEventListener('click', e => {
        const { target } = e;
        const listItem = target.closest('li');
        const deleteButton = target.closest('.remove');
        const content = target.closest('.content');
        const group = target.closest('.group');

        // Delete button
        if (deleteButton) {
            if (listItem.classList.contains('group')) {
                // Remove all windows in the group
                $$(`li[data-group-id="${listItem.id}"]`, windowsEl).forEach(item => {
                    electronAPI.deleteWindow(item.id);
                    item.remove();
                });
            } else {
                // Remove single item
                electronAPI.deleteWindow(listItem.id);
                listItem.remove();
            }

            // Remove empty groups
            $$('.group', windowsEl).forEach(item => {
                if (!$$(`li[data-group-id="${item.id}"]`, windowsEl).length) {
                    item.remove();
                }
            });
        // Expand/collapse
        } else if (content && content.parentElement === group) {
            group.classList.toggle('expanded');
        }
    });

    // Notification container
    const $notifyContainer = document.createElement('div');
    const $notifyElement = document.createElement('div');
    const $notifyMessage = document.createElement('div');

    $notifyContainer.id = 'notification-container';
    $notifyElement.id = 'notification';
    $notifyMessage.id = 'notification-message';

    $notifyContainer.hidden = true;
    $notifyElement.className = 'panel';

    $notifyElement.appendChild($notifyMessage);
    $notifyContainer.appendChild($notifyElement);
    document.body.appendChild($notifyContainer);

    electronAPI.receiveWindows(windows => {
        const grouped = Object.values(windows).reduce((result, data) => {
            const { process } = data;

            if (!result[process]) result[process] = [];

            result[process].push(data);
            return result;
        }, {});

        if (!windowsEl.innerText) {
            // Initial render
            const output = Object.entries(grouped).map(([process, items]) => {
                const processSlug = slug(process);

                return `<li id="group-${processSlug}" class="group"><div class="controls"><button class="remove">&times;</button></div><div class="content"><label for="group-${processSlug}"><img src="${items[0].icon || './images/icon-default.png'}" class="icon">${process} <span id="group-${processSlug}-count" class="group-count">${items.length}</span><span id="group-${processSlug}-total" class="group-total"></span></label></div><ul class="instances">` + items.map(data => {
                    return `<li id="${data.id}" data-group-id="group-${processSlug}"><div class="controls"><button class="remove">&times;</button></div><div class="content">${data.title}: <span class="active-time">${formatTime(data.activeTime).shortFormat}</span></div></li>`;
                }).join('\n') + '</ul></li>';
            });

            windowsEl.innerHTML = output.join('\n');
        } else {
            // Updates
            $$('.instances > li', windowsEl).forEach(item => {
                const { id } = item;

                if (!windows[id]) {
                    electronAPI.deleteWindow(id);
                    item.remove();
                }
            });

            // Remove empty groups
            $$('.group', windowsEl).forEach(item => {
                if (!$$(`li[data-group-id="${item.id}"]`, windowsEl).length) {
                    item.remove();
                }
            });

            Object.values(windows).forEach(data => {
                const { activeTime, icon, id, process, title } = data;
                const processSlug = slug(process);
                let item = $(`#${id}`);

                try {
                    if (!item) {
                        // Does the group exist?
                        let group = $(`#group-${processSlug}`);

                        if (!group) {
                            group = document.createElement('li');
                            group.id = `group-${processSlug}`;
                            group.className = 'group'; // expanded
                            group.innerHTML = `<div class="controls"><button class="remove">&times;</button></div><div class="content"><label for="group-${processSlug}"><img src="${icon || './images/icon-default.png'}" class="icon">${process} <span id="group-${processSlug}-count" class="group-count">1</span><span id="group-${processSlug}-total" class="group-total"></span></label></div><ul class="instances"></ul>`;
                            windowsEl.append(group);
                        } else {
                            // Update item count
                            $(`#group-${processSlug}-count`).textContent = grouped[process].length;
                        }

                        item = document.createElement('li');
                        item.id = id;
                        item.dataset.groupId = `group-${processSlug}`;
                        item.innerHTML = `<div class="controls"><button class="remove">&times;</button></div><div class="content">${title}: <span class="active-time">${formatTime(activeTime).shortFormat}</span></div>`;
                        $('.instances', group).append(item);
                    } else {
                        // Update active time
                        $('.active-time', item).textContent = formatTime(data.activeTime).shortFormat;

                        // Update item counts
                        $(`#group-${processSlug}-count`).textContent = grouped[process].length;

                        // Update total time
                        $(`#group-${processSlug}-total`).textContent = formatTime(grouped[process].reduce((result, win) => result + win.activeTime, 0)).shortFormat;
                    }
                } catch(e) {
                    console.error(processSlug, e.stack);
                }
            });
        }
    });
})();