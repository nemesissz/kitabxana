import serviceService from './service.service.js';

export const getAllServices = async (req, res, next) => {
  try {
    const { isActive, minPrice, maxPrice, search } = req.query;
    
    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (search) filters.search = search;

    const services = await serviceService.getAllServices(filters);

    res.status(200).json({
      status: 'success',
      data: {
        services,
        count: services.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await serviceService.getServiceById(id);

    if (!service) {
      return res.status(404).json({
        status: 'error',
        message: 'Service not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        service
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createService = async (req, res, next) => {
  try {
    console.log('🔍 Request body:', req.body);
    console.log('🔍 Request headers:', req.headers['content-type']);
    
    const service = await serviceService.createService(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        service
      },
      message: 'Service created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await serviceService.updateService(id, req.body);

    res.status(200).json({
      status: 'success',
      data: {
        service
      },
      message: 'Service updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await serviceService.deleteService(id);

    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveServices = async (req, res, next) => {
  try {
    const services = await serviceService.getActiveServices();

    res.status(200).json({
      status: 'success',
      data: {
        services
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getServicesPreview = async (req, res, next) => {
  try {
    const { limit, isActive } = req.query;
    
    // Convert isActive to boolean if provided
    let activeFilter = null;
    if (isActive !== undefined) {
      activeFilter = isActive === 'true';
    }
    
    const services = await serviceService.getServicesPreview(limit, activeFilter);

    res.status(200).json({
      status: 'success',
      data: {
        services,
        count: services.length
      }
    });
  } catch (error) {
    next(error);
  }
};