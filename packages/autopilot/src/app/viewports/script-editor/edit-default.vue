<template>
    <div class="edit-default section">
        <div class="edit-default__automation">
            <div class="section__title">
                Automation</div>
            <div class="edit-default__automation-meta">
                <div class="edit-default__automation-name"
                    @mouseenter.prevent="editShown = true"
                    @mouseleave.prevent="editShown = false">
                    <span v-if="!editing">{{ metadataProxy.serviceName }}
                        <i v-if="editShown"
                            class="fas fa-pencil-alt icon--small clickable"
                            @click.prevent="startEditing"></i>
                    </span>
                    <div v-else class="grid grid--gap">
                        <input class="input" type="text" v-model="metadataProxy.serviceName">
                        <div class="group">
                            <button class="button button--small button--primary"
                                @click.prevent="updateService">save</button>
                            <button class="button button--small button--secondary"
                                @click.prevent="cancel">cancel</button>
                        </div>
                    </div>
                </div>
                <edit-metadata/>
                <button v-if="!metadataProxy.serviceId"
                    class="button button--alt button--primary"
                    type="click"
                    @click="saveToAc">Save to the Automation Cloud</button>
            </div>
        </div>
        <hr>
        <div class="edit-default__pattern"
            @contextmenu.stop.prevent="popupMenu">
            <div class="section__title">
                Request Blocking
            </div>

            <div class="edit-default__pattern-item group group--gap--small stretch"
                v-for="(pattern, i) of scriptProxy.blockedUrlPatterns">
                <input class="input"
                    type="text"
                    :value="pattern"
                    @input="onEditPattern(i, $event)"/>
                <button class="button button--icon frameless"
                    title="Remove URL pattern"
                    @click="deleteBlockedPattern(i)">
                    <i class="fa fa-times"></i>
                </button>
            </div>

            <button class="button button--alt button--primary"
                @click="popupAddBlockedPattern()">
                <i class="button__icon fas fa-plus">
                </i>
                <span>Add URL Pattern</span>
            </button>

        </div>

    </div>
</template>

<script>
import { menu, clipboard } from '../../util';
import EditMetadata from './edit-metadata.vue';

export default {

    components: {
        EditMetadata
    },

    inject: [
        'browser',
        'saveload',
    ],

    data() {
        return {
            editShown: false,
            editing: false,
            newName: '',
        };
    },

    computed: {

        viewport() {
            return this.app.viewports.scriptEditor;
        },

        metadataProxy() {
            return this.viewport.getMetadataProxy();
        },

        scriptProxy() {
            return this.viewport.getScriptProxy();
        },

    },

    methods: {

        popupAddBlockedPattern() {
            menu.popupMenu([
                {
                    label: 'Block images',
                    click: () => this.addBlockedPatterns([
                        '*://*/*.jpg',
                        '*://*/*.jpeg',
                        '*://*/*.png',
                        '*://*/*.gif',
                        '*://*/*.svg',
                    ]),
                },
                {
                    label: 'Block fonts',
                    click: () => this.addBlockedPatterns([
                        '*://*/*.woff',
                        '*://*/*.woff2',
                        '*://*/*.ttf',
                        '*://*/*.otf',
                    ]),
                },
                {
                    label: 'Block visited origin',
                    submenu: this.getOriginPatterns().map(origin => {
                        return {
                            label: origin,
                            click: () => this.addBlockedPatterns([
                                origin
                            ])
                        };
                    }),
                },
                {
                    label: 'Add blank pattern',
                    click: () => this.addBlockedPatterns([
                        ''
                    ]),
                },
            ]);
        },

        addBlockedPatterns(patterns) {
            const patternSet = new Set(this.scriptProxy.blockedUrlPatterns);
            for (const p of patterns) {
                patternSet.add(p);
            }
            this.scriptProxy.blockedUrlPatterns = [...patternSet];
        },

        onEditPattern(index, ev) {
            const patterns = this.scriptProxy.blockedUrlPatterns.slice();
            patterns[index] = ev.target.value;
            this.scriptProxy.blockedUrlPatterns = patterns;
        },

        deleteBlockedPattern(index) {
            const patterns = this.scriptProxy.blockedUrlPatterns.slice();
            patterns.splice(index, 1);
            this.scriptProxy.blockedUrlPatterns = patterns;
        },

        getOriginPatterns() {
            const patterns = new Set(this.browser.visitedOrigins
                .map(origin => {
                    // This is to make url pattern for domain: example.com/
                    // covers following origins:
                    // - http://www.example.com
                    // - https://www.example.com
                    // - https://example.com
                    // - https://extra.www.example.com
                    origin = origin.replace(/^https?:\/\//, '');
                    const domainWithoutTopLevel = origin.substring(0, origin.lastIndexOf('.'));
                    const domainNameIndex = domainWithoutTopLevel.lastIndexOf('.') + 1;
                    const domain = origin.substring(domainNameIndex);
                    return '*://*.' + domain + '/';
                }));
            for (const p of this.scriptProxy.blockedUrlPatterns) {
                patterns.delete(p);
            }
            return [...patterns];
        },

        canPasteBlockedPatterns() {
            return clipboard.hasObjectType('script-blocked-patterns');
        },

        pasteBlockedPatterns() {
            const patterns = clipboard.readObjectData('script-blocked-patterns');
            if (!patterns || !Array.isArray(patterns)) {
                return;
            }
            this.addBlockedPatterns(patterns);
        },

        popupMenu() {
            menu.popupMenu([
                {
                    label: 'Copy all patterns',
                    click: () => clipboard.writeObject({
                        type: 'script-blocked-patterns',
                        data: this.scriptProxy.blockedUrlPatterns
                    }),
                    enabled: this.scriptProxy.blockedUrlPatterns.length > 0
                },
                {
                    label: 'Paste patterns',
                    click: () => this.pasteBlockedPatterns(),
                    enabled: this.canPasteBlockedPatterns(),
                },
            ]);
        },

        saveToAc() {
            this.saveload.location = 'ac';
            this.saveload.saveAutomation();
        },

        startEditing() {
            this.oldName = this.metadataProxy.serviceName;
            this.editing = true;
        },

        cancel() {
            this.viewport.commands.editMetadata('serviceName', this.oldName);
            this.editing = false;
        },

        async updateService() {
            await this.saveload.syncService();
            this.editing = false;
        }
    },
};
</script>

<style>
.edit-default {
    padding: 0 var(--gap--small);
    display: flex;
    flex-flow: column nowrap;
}

.edit-default__automation {
    display: flex;
}

.edit-default__automation-meta {
    flex: 1;
    margin: var(--gap--large);
    margin-right: 0px;
}

.edit-default__automation-name {
    margin-bottom: var(--gap--large);
    font-family: var(--font-family--alt);
    font-size: var(--font-size--alt);
}

.edit-default__pattern {
    flex-grow: 2;
}

.edit-default__pattern-item {
    margin-bottom: var(--gap--small);
}
</style>
