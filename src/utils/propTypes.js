/**
 * src/utils/propTypes.js
 * PropTypes condivisi per modali e componenti ricorrenti.
 */

import PropTypes from 'prop-types';

export const modalBase = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export const facilityShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  name: PropTypes.string,
  company_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  udo_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  bed_count: PropTypes.number,
  posti_letto: PropTypes.number,
  is_suspended: PropTypes.bool,
  type: PropTypes.string,
  city: PropTypes.string,
  address: PropTypes.string,
  referent: PropTypes.string,
  areageografica: PropTypes.string,
  region: PropTypes.string,
  regione: PropTypes.string
});

export const modalWithFacility = {
  ...modalBase,
  facility: facilityShape,
  onSave: PropTypes.func,
  onDelete: PropTypes.func
};

export const modalWithFacilities = {
  ...modalBase,
  facilities: PropTypes.arrayOf(facilityShape),
  udos: PropTypes.array,
  surveys: PropTypes.array,
  kpiRecords: PropTypes.array,
  year: PropTypes.number
};
