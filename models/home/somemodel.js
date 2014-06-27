function homeModel(){
    var self=this;
    this.name='';
    this.setName=function(newName){
        self.name=newName;
    };

    this.toJson=function(){
        return {
            name:self.name
        }
    }

    return self;
}

module.exports = homeModel;