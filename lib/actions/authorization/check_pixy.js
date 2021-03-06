'use strict';

const errors = require('../../helpers/errors');
const instance = require('../../helpers/weak_cache');

const ALLOWED = ['plain', 'S256'];

/*
 * (optional[true]) assign default code_challenge_method if a code_challenge is provided
 * (optional[true]) check presence of code code_challenge if code_challenge_method is provided
 * (feature|optional[false]) enforce PKCE use for native clients using hybrid or code flow
 */
module.exports = (provider) => {
  const pkce = instance(provider).configuration('features.pkce');
  return function* checkPixy(next) {
    const params = this.oidc.params;

    if (pkce && params.code_challenge_method) {
      this.assert(ALLOWED.indexOf(params.code_challenge_method) !== -1,
        new errors.InvalidRequestError('not supported value of code_challenge_method'));

      this.assert(params.code_challenge,
        new errors.InvalidRequestError('code_challenge must be provided with code_challenge_method'));
    }

    if (pkce && !params.code_challenge_method && params.code_challenge) {
      params.code_challenge_method = 'plain';
    }

    const forced = pkce &&
      pkce.forcedForNative &&
      params.response_type.includes('code') &&
      this.oidc.client.applicationType === 'native';

    if (forced) {
      this.assert(params.code_challenge,
        new errors.InvalidRequestError('PKCE must be provided for native clients'));
    }

    yield next;
  };
};
