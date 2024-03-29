/*
 * Copyright (C) 2024  Puter Technologies Inc.
 *
 * This file is part of Phoenix Shell.
 *
 * Phoenix Shell is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
export class HistoryManager {
    constructor() {
        this.items = [];
        this.index_ = 0;
        this.listeners_ = {};
    }

    log(...a) {
        // TODO: proper logging and verbosity config
        // console.log('[HistoryManager]', ...a);
    }

    get index() {
        return this.index_;
    }

    set index(v) {
        this.log('setting index', v);
        this.index_ = v;
    }

    get() {
        return this.items[this.index];
    }

    save(data, { opt_debug } = {}) {
        this.log('saving', data, 'at', this.index,
            ...(opt_debug ? [ 'from', opt_debug ] : []));
        this.items[this.index] = data;

        if (this.listeners_.hasOwnProperty('add')) {
            for (const listener of this.listeners_.add) {
                listener(data);
            }
        }
    }

    on(topic, listener) {
        if (!this.listeners_.hasOwnProperty(topic)) {
            this.listeners_[topic] = [];
        }
        this.listeners_[topic].push(listener);
    }
}