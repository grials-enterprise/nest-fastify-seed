import {
  stopKafkaContainer,
  stopMongoDbContainer,
} from '@grials/testing-tools';

const containers = [stopKafkaContainer];

export const stopContainer = () =>
  Promise.all(containers.map((func) => func()));

if (import.meta.main) {
  containers.push(stopMongoDbContainer);
  stopContainer();
}
