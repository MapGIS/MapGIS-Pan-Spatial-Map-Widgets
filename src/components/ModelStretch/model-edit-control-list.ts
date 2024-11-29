/**
 * ModelEditControlList对象
 * @return Object
 */
class ModelEditControlList {
  private _modelEditControlList = new Object()

  public get modelEditControlList() {
    return this._modelEditControlList
  }

  public set modelEditControlList(Obj) {
    this._modelEditControlList = Obj
  }
}

export default new ModelEditControlList()
