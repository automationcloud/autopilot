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

import { runtime } from '../runtime';
import assert from 'assert';
import jsonPointer from 'jsonpointer';
import { Pipe, Element } from '../../main';
import { params } from '../../main/model';

describe('Pipe', () => {

    describe('ancestorPipes', () => {
        it('returns pipes up the hierarchy', () => {
            const pipeline = createPipeline();
            const inner = [...pipeline.descendentPipes()].find(_ => _.type === 'Value.getConstant');
            assert.ok(inner);
            const ancestors = [...inner!.ancestorPipes()];
            assert.deepEqual(ancestors.map(_ => _.type), ['Object.setPath', 'Value.equals']);
        });
    });

    describe('$path', () => {
        it('returns JSON pointer to deserialized pipe', () => {
            const pipeline = createPipeline();
            const inner = [...pipeline.descendentPipes()].find(_ => _.type === 'Value.getConstant');
            assert.ok(inner);
            assert.equal(inner?.$path, '/contexts/items/0/definitions/items/0/pipeline/items/0/pipelineA/items/0/pipeline/items/0');
        });

        it('reaches the pipeline in deserialized script and serialized script spec', () => {
            const pipeline = createPipeline();
            const inner = [...pipeline.descendentPipes()].find(_ => _.type === 'Value.getConstant');
            const path = inner!.$path;
            // In serialized script
            const pipe = jsonPointer.get(pipeline.$script, path);
            assert.equal(pipe.type, 'Value.getConstant');
            // In de-serialized script
            const serializedScript = JSON.parse(JSON.stringify(pipeline.$script));
            const pipeSpec = jsonPointer.get(serializedScript, path);
            assert.equal(pipeSpec.type, 'Value.getConstant');
            // The two must match
            assert.deepEqual(pipeSpec, JSON.parse(JSON.stringify(pipe)));
        });
    });

    describe('params', () => {

        abstract class BasePipe extends Pipe {
            @params.String()
            paramBase: string = 'foo';
        }

        class PipeA extends BasePipe {
            @params.String()
            paramA: string = 'zoo';
            @params.String()
            otherParamA: string = 'bar';

            async apply(list: Element[]) {
                return list;
            }
        }

        class PipeB extends BasePipe {
            @params.String()
            paramB: string = 'zoo';

            async apply(list: Element[]) {
                return list;
            }
        }

        it('inherits parameters from base class', async () => {
            const pipeline = runtime.createPipeline([]);
            const pipeA = new PipeA(pipeline);
            const pipeB = new PipeB(pipeline);
            assert.deepEqual(pipeA.getParams().map(_ => _.name), ['paramBase', 'paramA', 'otherParamA']);
            assert.deepEqual(pipeB.getParams().map(_ => _.name), ['paramBase', 'paramB']);
        });

    });

});

function createPipeline() {
    return runtime.createPipeline([
        {
            type: 'Value.equals',
            pipelineA: [
                {
                    type: 'Object.setPath',
                    path: '/foo',
                    pipeline: [
                        { type: 'Value.getConstant' },
                    ]
                }
            ]
        }
    ]);
}
