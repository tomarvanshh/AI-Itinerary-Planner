export let sourceCity = null;
export let destinationCity = null;

export let selectedTransport = null;
export let lockedTransport = null;

export function setSourceCity(city) {
  sourceCity = city;
}

export function setDestinationCity(city) {
  destinationCity = city;
}

export function setSelectedTransport(transport) {
  selectedTransport = transport;
}

export function setLockedTransport(transport) {
  lockedTransport = transport;
}

export function resetTransportState() {
  selectedTransport = null;
  lockedTransport = null;
}
