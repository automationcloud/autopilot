# Worker

Worker embeds `@automationcloud/engine` and integrates with the rest of automationcloud.net to be able to execute jobs.

## Development

1. Follow instructions from `@automationcloud/autopilot` README.

2. Setup environment by copying `.env.exmaple` to `.env` and modifying it to fit your needs.

3. You'll need Redis to run tests. You can run one with Docker:

    ```
    docker run --name=ub-redis -p 6379:6379 redis
    ```

4. To build worker image, run `npm run docker:build-worker` in Project root (not here).

### Worker Tags (aka Worker Pools)

Sometimes we deploy multiple different worker images simultaneously (e.g. to allow scripts to be migrated, or to test experimental stuff). In this case we allocate different worker tags to each deployment, so that different services can be routed to specific worker image for execution. We refer to a group of worker containers sharing the same worker tag as "worker pool".

Worker tag is defined by `WORKER_TAG` variable. We use `stable` for "main" pool.

### Known quirks

#### /dev/shm

Chromium needs a relatively large `/dev/shm` partition (200MB or bigger) to run properly. With Docker use `--shm-size` option, with k8s it is possible to mount a tmpfs volume:

```
    volumes:
    - emptyDir:
        medium: Memory
    name: dshm
```

A quick way to test if container has sufficient `/dev/shm` is:

```
kubectl exec -it worker-udf-6c8795fb78-xf5cf sh
$ df -h
...
tmpfs           1.8G   16M  1.8G   1% /dev/shm
```

If it's something around 100MB or less, then Chrome will start crashing for obscure reasons soon.

## License

See [LICENSE](LICENSE.md).
