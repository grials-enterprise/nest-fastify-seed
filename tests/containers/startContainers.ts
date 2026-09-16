import {
  startKafkaContainer,
  startMongoDbContainer,
} from '@grials/testing-tools';

const containers = [startKafkaContainer];

export const startContainer = () =>
  Promise.all(containers.map((func) => func()));

if (import.meta.main) {
  containers.push(startMongoDbContainer);
  startContainer();
}
