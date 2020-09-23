// Copyright 2020 Ubio Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { App } from '../app';
import { ModalMenuController } from './modal-menu';
import { NavigationController } from './navigation';
import { ClipboardLoaderController } from './clipboard-loader';
import { ObjectsController } from './objects';
import { HelpController } from './help';
import { FrequentItemController } from './frequent-item';
import { FeedbackController } from './feedback';

export { ClipboardLoaderController, ModalMenuController, NavigationController };

export interface AppUiControllers {
    clipboardLoader: ClipboardLoaderController;
    modalMenu: ModalMenuController;
    navigation: NavigationController;
    objects: ObjectsController;
    help: HelpController;
    frequentItems: FrequentItemController;
    feedbacks: FeedbackController;
}

export function createUiControllers(app: App): AppUiControllers {
    return {
        clipboardLoader: new ClipboardLoaderController(app),
        modalMenu: new ModalMenuController(app),
        navigation: new NavigationController(app),
        objects: new ObjectsController(app),
        help: new HelpController(app),
        frequentItems: new FrequentItemController(app),
        feedbacks: new FeedbackController(app),
    };
}
