window.PCB = {
  CATS: {
    gastro:   { label: 'Gastronomía',       color: '#F5A623', dim: '#7d5310' },
    retail:   { label: 'Retail & Comercio', color: '#3DD6F5', dim: '#0f6479' },
    hotel:    { label: 'Hotelería',         color: '#3DE6B4', dim: '#0f6e56' },
    erp:      { label: 'ERP & Gestión',     color: '#A78BFA', dim: '#4e3d8f' },
    finanzas: { label: 'Contabilidad',      color: '#5EE3A0', dim: '#1f6e44' },
    bi:       { label: 'BI & Reporting',    color: '#FFD24D', dim: '#7d6310' },
  },

  ROW_Y: [110, 320, 760, 970],
  COL_X: [140, 420, 1080, 1360],

  SYSTEMS: [
    { row: 0, col: 0, name: 'Gestión Cervecera', mark: 'GC', sub: 'Cervecerías',    cat: 'gastro'   },
    { row: 0, col: 1, name: 'Fudo',              mark: 'F',  sub: 'Franquicias',    cat: 'gastro'   },
    { row: 0, col: 2, name: 'Maxirest',          mark: 'M',  sub: 'Gastronomía',    cat: 'gastro'   },
    { row: 0, col: 3, name: 'Toteat',            mark: 'T',  sub: 'Restaurantes',   cat: 'gastro'   },
    { row: 1, col: 0, name: 'Bistrosoft',        mark: 'B',  sub: 'Restaurantes',   cat: 'gastro'   },
    { row: 1, col: 1, name: 'Control Comercio',  mark: 'CC', sub: 'Comercio',       cat: 'retail'   },
    { row: 1, col: 2, name: 'Dragonfish',        mark: 'DF', sub: 'Moda',           cat: 'retail'   },
    { row: 1, col: 3, name: 'Optix',             mark: 'OX', sub: 'Ópticas',        cat: 'retail'   },
    { row: 2, col: 0, name: 'PxSol',             mark: 'PX', sub: 'Hotelería',      cat: 'hotel'    },
    { row: 2, col: 1, name: 'Odoo',              mark: 'O',  sub: 'ERP',            cat: 'erp'      },
    { row: 2, col: 2, name: 'Power BI',          mark: 'PB', sub: 'BI / Reporting', cat: 'bi'       },
    { row: 2, col: 3, name: 'Looker Studio',     mark: 'LS', sub: 'BI / Reporting', cat: 'bi'       },
    { row: 3, col: 0, name: 'Administranet',     mark: 'AN', sub: 'Gestión',        cat: 'erp'      },
    { row: 3, col: 1, name: 'Contabilium',       mark: 'CB', sub: 'Finanzas',       cat: 'finanzas' },
    { row: 3, col: 2, name: 'SGC',              mark: 'S',  sub: 'Contabilidad',   cat: 'finanzas' },
    { row: 3, col: 3, name: 'SOS Contador',     mark: 'SC', sub: 'Contador',       cat: 'finanzas' },
  ],
};
