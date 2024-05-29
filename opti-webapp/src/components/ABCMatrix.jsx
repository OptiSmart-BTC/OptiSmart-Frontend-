/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import './../styles/components/ABCMatrix.css';

function ABCMatrix() {
    const [inputs, setInputs] = useState({
        varAlta: '1.5',
        varMedia: '0.5',
        VaMbDmb: 'D', VaMaDmb: 'D', VaMbDb: 'C', VaMaDb: 'C',
        VaMbDm: 'C', VaMaDm: 'B', VaMbDa: 'B', VaMaDa: 'B',
        VmMbDmb: 'D', VmMaDmb: 'C', VmMbDb: 'C', VmMaDb: 'C',
        VmMbDm: 'B', VmMaDm: 'B', VmMbDa: 'A', VmMaDa: 'A',
        VbMbDmb: 'C', VbMaDmb: 'C', VbMbDb: 'C', VbMaDb: 'B',
        VbMbDm: 'B', VbMaDm: 'A', VbMbDa: 'A', VbMaDa: 'A',
        MbDmb: '30', MaDmb: '30', MbDb: '30', MaDb: '30',
        MbDm: '30', MaDm: '30', MbDa: '30', MaDa: '30'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="row align-items-center">
            <div className="col-10">
                <div className="m-2">
                    <div className="table-responsive">
                        <table className="table table-bordered" id="dataTableg" cellSpacing="0" style={{ textAlign: 'center' }}>
                            <thead>
                                <tr></tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th rowSpan="3" style={{ backgroundColor: 'rgb(84, 130, 53)', color: 'white', writingMode: 'vertical-rl', transform: 'rotate(180deg)', lineHeight: '5%', marginTop: '30%', width:'5%' }} className="ml-2">
                                        <br /><br />VARIABILIDAD
                                        <a data-toggle="modal" data-target="#variMod">
                                            <i className="fas fa-info-circle fa-sm fa-fw mr-2 text-gray-400" data-toggle="modal" data-target="#variMod"></i>
                                        </a>
                                    </th>
                                    <th rowSpan="3" className="verdito">
                                        <p>Alta</p>
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            style={{ width: '80%', marginLeft: '10%', marginTop: '10px' }}
                                            name="varAlta"
                                            placeholder="varAlta%"
                                            onChange={handleChange}
                                            value={inputs.varAlta}
                                        />
                                        <p>Media</p>
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            style={{ width: '80%', marginLeft: '10%' }}
                                            name="varMedia"
                                            placeholder="varMed%"
                                            onChange={handleChange}
                                            value={inputs.varMedia}
                                        />
                                        <p>Baja</p>
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VaMbDmb"
                                            placeholder="VaMbDmb"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VaMbDmb}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VaMaDmb"
                                            placeholder="VaMaDmb"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VaMaDmb}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VaMbDb"
                                            placeholder="VaMbDb"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VaMbDb}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VaMaDb"
                                            placeholder="VaMaDb"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VaMaDb}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VaMbDm"
                                            placeholder="VaMbDm"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VaMbDm}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VaMaDm"
                                            placeholder="VaMaDm"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VaMaDm}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VaMbDa"
                                            placeholder="VaMbDa"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VaMbDa}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VaMaDa"
                                            placeholder="VaMaDa"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VaMaDa}
                                        />
                                    </th>
                                </tr>
                                <tr>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VmMbDmb"
                                            placeholder="VmMbDmb"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VmMbDmb}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VmMaDmb"
                                            placeholder="VmMaDmb"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VmMaDmb}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VmMbDb"
                                            placeholder="VmMbDb"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VmMbDb}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VmMaDb"
                                            placeholder="VmMaDb"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VmMaDb}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VmMbDm"
                                            placeholder="VmMbDm"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VmMbDm}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VmMaDm"
                                            placeholder="VmMaDm"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VmMaDm}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VmMbDa"
                                            placeholder="VmMbDa"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VmMbDa}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VmMaDa"
                                            placeholder="VmMaDa"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VmMaDa}
                                        />
                                    </th>
                                </tr>
                                <tr>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VbMbDmb"
                                            placeholder="VbMbDmb"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VbMbDmb}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VbMaDmb"
                                            placeholder="VbMaDmb"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VbMaDmb}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VbMbDb"
                                            placeholder="VbMbDb"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VbMbDb}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VbMaDb"
                                            placeholder="VbMaDb"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VbMaDb}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VbMbDm"
                                            placeholder="VbMbDm"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VbMbDm}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VbMaDm"
                                            placeholder="VbMaDm"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VbMaDm}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VbMbDa"
                                            placeholder="VbMbDa"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VbMbDa}
                                        />
                                    </th>
                                    <th className="amarillito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="VbMaDa"
                                            placeholder="VbMaDa"
                                            onKeyDown="ValidateActInsert(this)"
                                            maxLength="1"
                                            minLength="1"
                                            onChange={handleChange}
                                            value={inputs.VbMaDa}
                                        />
                                    </th>
                                </tr>
                                <tr>
                                    <th colSpan="2" rowSpan="2" style={{ backgroundColor: 'rgb(48, 84, 150)', color: 'white'}}>
                                        <br />MARGEN
                                        <a data-toggle="modal" data-target="#margMod">
                                            <i className="fas fa-info-circle fa-sm fa-fw mr-2 text-gray-400" data-toggle="modal" data-target="#margMod"></i>
                                        </a>
                                    </th>
                                    <th className="azulito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="MbDmb"
                                            placeholder="mBajo%"
                                            onKeyUp="updInpsMargen()"
                                            onChange={handleChange}
                                            value={inputs.MbDmb}
                                        />
                                    </th>
                                    <th className="azulito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="MaDmb"
                                            placeholder="%"
                                            onChange={handleChange}
                                            value={inputs.MaDmb}
                                        />
                                    </th>
                                    <th className="azulito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="MbDb"
                                            placeholder="%"
                                            onChange={handleChange}
                                            value={inputs.MbDb}
                                        />
                                    </th>
                                    <th className="azulito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="MaDb"
                                            placeholder="%"
                                            onChange={handleChange}
                                            value={inputs.MaDb}
                                        />
                                    </th>
                                    <th className="azulito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="MbDm"
                                            placeholder="%"
                                            onChange={handleChange}
                                            value={inputs.MbDm}
                                        />
                                    </th>
                                    <th className="azulito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="MaDm"
                                            placeholder="%"
                                            onChange={handleChange}
                                            value={inputs.MaDm}
                                        />
                                    </th>
                                    <th className="azulito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="MbDa"
                                            placeholder="%"
                                            onChange={handleChange}
                                            value={inputs.MbDa}
                                        />
                                    </th>
                                    <th className="azulito">
                                        <input
                                            type="text"
                                            className="form-control form-control-user text-center"
                                            name="MaDa"
                                            placeholder="%"
                                            onChange={handleChange}
                                            value={inputs.MaDa}
                                        />
                                    </th>
                                </tr>
                                <tr>
                                    <th className="azulito2" >Bajo</th>
                                    <th className="azulito2" >Alto</th>
                                    <th className="azulito2" >Bajo</th>
                                    <th className="azulito2" >Alto</th>
                                    <th className="azulito2" >Bajo</th>
                                    <th className="azulito2" >Alto</th>
                                    <th className="azulito2" >Bajo</th>
                                    <th className="azulito2" >Alto</th>
                                </tr>
                                <tr>
                                    <th className="borderless"></th>
                                    <th className="borderless"></th>
                                    <th colSpan="2" className="naranjita">
                                        <input
                                            type="number"
                                            className="form-control form-control-user text-center"
                                            style={{ width: '60%', marginLeft: '15%' }}
                                            name="Dmb"
                                            placeholder="Muy Baja %"
                                            onChange={handleChange}
                                            value={inputs.Dmb}
                                        />
                                    </th>
                                    <th colSpan="2" className="naranjita">
                                        <input
                                            type="number"
                                            className="form-control form-control-user text-center"
                                            style={{ width: '60%', marginLeft: '15%' }}
                                            name="Db"
                                            placeholder="Baja %"
                                            onKeyUp="valDemanda()"
                                            onChange={handleChange}
                                            value={inputs.Db}
                                        />
                                    </th>
                                    <th colSpan="2" className="naranjita">
                                        <input
                                            type="number"
                                            className="form-control form-control-user text-center"
                                            style={{ width: '60%', marginLeft: '15%' }}
                                            name="Dm"
                                            placeholder="Media %"
                                            onKeyUp="valDemanda()"
                                            onChange={handleChange}
                                            value={inputs.Dm}
                                        />
                                    </th>
                                    <th colSpan="2" className="naranjita">
                                        <input
                                            type="number"
                                            className="form-control form-control-user text-center"
                                            style={{ width: '60%', marginLeft: '15%' }}
                                            name="Da"
                                            placeholder="Alta %"
                                            onKeyUp="valDemanda()"
                                            onChange={handleChange}
                                            value={inputs.Da}
                                        />
                                    </th>
                                </tr>
                                <tr>
                                    <th className="borderless"></th>
                                    <th className="borderless"></th>
                                    <th colSpan="2" className="naranjita">Muy Baja</th>
                                    <th colSpan="2" className="naranjita">Baja</th>
                                    <th colSpan="2" className="naranjita">Media</th>
                                    <th colSpan="2" className="naranjita">Alta</th>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th className="borderless"></th>
                                    <th className="borderless"></th>
                                    <th colSpan="8" style={{ backgroundColor: 'rgb(198, 89, 17)', color: 'white', padding:'1.5%' }}>DEMANDA
                                        <a data-toggle="modal" data-target="#demaMod">
                                            <i className="fas fa-info-circle fa-sm fa-fw mr-2 text-gray-400" data-toggle="modal" data-target="#demaMod"></i>
                                        </a>
                                    </th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
            <div className="col-1"></div>
        </div>
    );
}

export default ABCMatrix;
